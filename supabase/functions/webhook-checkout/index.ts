import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface CheckoutPayload {
  email: string;
  name: string;
  transaction_id?: string;
  product_id?: string;
  status: "approved" | "pending" | "rejected";
  webhook_secret?: string;
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

    const payload: CheckoutPayload = await req.json();
    
    console.log("Webhook received:", { 
      email: payload.email, 
      name: payload.name, 
      status: payload.status,
      transaction_id: payload.transaction_id 
    });

    // Validate required fields
    if (!payload.email || !payload.name) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process approved payments
    if (payload.status !== "approved") {
      return new Response(
        JSON.stringify({ message: "Pagamento não aprovado, usuário não criado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === payload.email);

    let userId: string;

    if (existingUser) {
      // User already exists, just update profile status
      userId = existingUser.id;
      console.log("User already exists:", userId);

      // Update profile status to active
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ status: "ativo", name: payload.name })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    } else {
      // Create new user in Supabase Auth (without password - user will set it on first login)
      const tempPassword = crypto.randomUUID(); // Temporary password, user will reset
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: payload.name,
          needs_password_reset: true,
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
          email: payload.email,
          name: payload.name,
          status: "ativo",
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail the webhook, user was created
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Usuário criado/atualizado com sucesso",
        user_id: userId,
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