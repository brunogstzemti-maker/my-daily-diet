import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Appmax webhook payload structure (modelo padrão)
interface AppmaxWebhookPayload {
  // Customer data
  customer_email?: string;
  customer_name?: string;
  customer_firstname?: string;
  customer_lastname?: string;
  customer_telephone?: string;
  customer_cpf?: string;
  
  // Order data
  order_id?: string;
  order_status?: string;
  order_total?: number;
  
  // Product data
  product_sku?: string;
  product_name?: string;
  
  // Transaction data
  transaction_id?: string;
  payment_method?: string;
  
  // Event type
  event?: string;
  
  // Alternative format (some templates use nested structure)
  customer?: {
    email?: string;
    name?: string;
    firstname?: string;
    lastname?: string;
  };
  order?: {
    id?: string;
    status?: string;
    total?: number;
  };
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
    
    // Extract email and name from different possible payload formats
    const email = payload.customer_email || payload.customer?.email;
    const name = payload.customer_name || 
                 payload.customer?.name || 
                 `${payload.customer_firstname || payload.customer?.firstname || ''} ${payload.customer_lastname || payload.customer?.lastname || ''}`.trim();
    
    const orderId = payload.order_id || payload.order?.id;
    const orderStatus = payload.order_status || payload.order?.status;
    const event = payload.event;

    console.log("Appmax Webhook received:", { 
      email, 
      name, 
      orderId,
      orderStatus,
      event,
      transactionId: payload.transaction_id 
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
      // Create new user in Supabase Auth (without password - user will set it on first login)
      const tempPassword = crypto.randomUUID();
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: name,
          needs_password_reset: true,
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