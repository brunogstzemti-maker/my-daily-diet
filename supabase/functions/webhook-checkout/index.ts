import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hotmart Webhook Payload Interfaces
interface HotmartBuyer {
  email: string;
  name: string;
  checkout_phone?: string;
}

interface HotmartPurchase {
  offer_code?: string;
  order_date?: number;
  original_offer_price?: {
    value: number;
    currency_value: string;
  };
  payment_type?: string;
  price?: {
    value: number;
    currency_value: string;
  };
  status: string;
  transaction: string;
}

interface HotmartProduct {
  id: number;
  name: string;
}

interface HotmartData {
  buyer: HotmartBuyer;
  product?: HotmartProduct;
  purchase: HotmartPurchase;
}

interface HotmartWebhookPayload {
  data: HotmartData;
  event: string;
  id: string;
  version: string;
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

    const payload: HotmartWebhookPayload = await req.json();
    console.log("Hotmart Webhook received:", JSON.stringify(payload));

    // Extract data from Hotmart payload
    // Hotmart 2.0 structure usually puts data inside 'data' property
    const email = payload.data?.buyer?.email;
    const name = payload.data?.buyer?.name;
    const transactionId = payload.data?.purchase?.transaction;
    const status = payload.data?.purchase?.status;
    const event = payload.event;

    // Validate required fields
    if (!email) {
      console.error("Email not found in payload:", payload);
      return new Response(
        JSON.stringify({ error: "Email do cliente não encontrado no payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List of approved status/events from Hotmart
    // Events: PURCHASE_APPROVED, PURCHASE_COMPLETE
    // Status: APPROVED, COMPLETED
    const approvedEvents = [
      "PURCHASE_APPROVED",
      "PURCHASE_COMPLETE",
      "SWITCH_PLAN_AUDIT", // Sometimes used for upgrades
    ];

    const approvedStatuses = [
      "APPROVED",
      "COMPLETED",
      "BILLED", // Faturado
    ];

    const isApproved =
      (event && approvedEvents.includes(event)) ||
      (status && approvedStatuses.includes(status.toUpperCase()));

    if (!isApproved) {
      console.log("Purchase not approved yet:", { event, status });
      return new Response(
        JSON.stringify({
          message: "Evento recebido, aguardando aprovação da compra",
          event,
          status
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      throw new Error(`Error listing users: ${listUsersError.message}`);
    }

    const existingUser = users.find(u => u.email === email);
    let userId: string;

    if (existingUser) {
      // User already exists, ensure profile is active
      userId = existingUser.id;
      console.log("User already exists:", userId);

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          status: "ativo",
          name: name || existingUser.user_metadata?.name
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    } else {
      // Create new user
      // Default password for easy access: 123456
      const tempPassword = "123456";

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: name,
          hotmart_transaction: transactionId,
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
              from: "Daily Diet <onboarding@resend.dev>",
              to: [email],
              subject: "Acesso Liberado! Sua dieta chegou 🥗",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #00A86B;">Seu acesso foi liberado!</h1>
                  <p>Olá, <strong>${name || 'Cliente'}</strong>!</p>
                  <p>Sua compra na Hotmart foi confirmada e sua conta já está pronta.</p>
                  
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
                  
                  <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    Transação Hotmart: ${transactionId || 'N/A'}
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

    console.log("Hotmart integration successful for:", email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário processado com sucesso (Hotmart)",
        user_id: userId,
        transaction_id: transactionId,
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