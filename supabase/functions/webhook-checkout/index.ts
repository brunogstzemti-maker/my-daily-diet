import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Appmax webhook payload structure (formato real da Appmax)
interface AppmaxCustomer {
  id?: number;
  email?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  telephone?: string;
  document_number?: string;
}

interface AppmaxData {
  id?: number;
  customer_id?: number;
  status?: string;
  total?: number;
  customer?: AppmaxCustomer;
}

interface AppmaxWebhookPayload {
  environment?: string;
  event?: string;
  data?: AppmaxData;

  // Fallback for flat structure
  customer_email?: string;
  customer_name?: string;
  customer_firstname?: string;
  customer_lastname?: string;
  order_id?: string;
  order_status?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const payload: AppmaxWebhookPayload = await req.json();

    // Extract from nested data structure (real Appmax format) or flat structure
    const email = payload.data?.customer?.email || payload.customer_email;
    const name = payload.data?.customer?.fullname ||
      payload.data?.customer?.firstname && payload.data?.customer?.lastname
      ? `${payload.data.customer.firstname} ${payload.data.customer.lastname}`.trim()
      : payload.customer_name ||
      `${payload.customer_firstname || ''} ${payload.customer_lastname || ''}`.trim();

    const orderId = payload.data?.id?.toString() || payload.order_id;
    const orderStatus = payload.data?.status || payload.order_status;
    const event = payload.event;

    console.log("Appmax Webhook received:", {
      email,
      name,
      orderId,
      orderStatus,
      event,
    });

    // Validate required fields
    if (!email) {
      console.error("Email not found in payload:", payload);
      return new Response(
        JSON.stringify({ error: "Email do cliente não encontrado no payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List of approved status/events from Appmax
    const approvedEvents = [
      "OrderApproved",      // Pedido aprovado
      "OrderIntegrated",    // Pedido integrado (última etapa)
      "OrderPaid",          // Pedido pago
      "PixPaid",            // Pix pago
      "UpsellPaid",         // Upsell pago
    ];

    const approvedStatuses = [
      "approved",
      "aprovado",
      "integrated",
      "integrado",
      "paid",
      "pago"
    ];

    const isApproved = approvedEvents.includes(event || "") ||
      approvedStatuses.includes((orderStatus || "").toLowerCase());

    if (!isApproved) {
      console.log("Order not approved yet:", { event, orderStatus });
      return new Response(
        JSON.stringify({
          message: "Evento recebido, aguardando aprovação do pedido",
          event,
          orderStatus
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // User already exists, update profile status to active
      userId = existingUser.id;
      console.log("User already exists:", userId);

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ status: "ativo", name: name || existingUser.user_metadata?.name })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    } else {
      // Generate a user-friendly password (8 characters)
      // Generate a simplified fixed password for easy access
      const tempPassword = "123456";

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: name,
          appmax_order_id: orderId,
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar usuário", details: authError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;
      console.log("User created:", userId);

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          email: email,
          name: name || "Cliente",
          status: "ativo",
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      // Send email with credentials using Resend
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Daily Diet <onboarding@resend.dev>", // Você deve trocar isso pelo seu domínio depois
              to: [email],
              subject: "Acesso Liberado! Sua dieta chegou 🥗",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #00A86B;">Seu acesso foi liberado!</h1>
                  <p>Olá, <strong>${name || 'Cliente'}</strong>!</p>
                  <p>Seu pagamento foi confirmado e sua conta já está pronta.</p>
                  
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #666;">Seu Login:</p>
                    <p style="margin: 5px 0 15px 0; font-weight: bold; font-size: 18px;">${email}</p>
                    
                    <p style="margin: 0; color: #666;">Sua Senha Provisória:</p>
                    <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 24px; color: #000;">${tempPassword}</p>
                  </div>

                  <p>Clique no botão abaixo para acessar agora:</p>
                  <a href="https://dietapersonalizadapp.netlify.app/" style="background-color: #00A86B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Acessar Plataforma
                  </a>
                  
                  <p style="margin-top: 30px; font-size: 12px; color: #888;">
                    Recomendamos que você troque esta senha após o primeiro acesso.
                  </p>
                </div>
              `
            }),
          });

          if (!res.ok) {
            const errorData = await res.text();
            console.error("Resend API Error:", errorData);
          } else {
            console.log("Welcome email sent via Resend");
          }
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      } else {
        console.log("RESEND_API_KEY not found. Skipping email.");
      }

    }


    console.log("Appmax integration successful for:", email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário criado/atualizado com sucesso",
        user_id: userId,
        order_id: orderId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});