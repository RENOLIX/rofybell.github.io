import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } } },
    );
    const { data: caller } = await callerClient.auth.getUser();
    const callerIsAdminFromToken = caller.user?.user_metadata?.role === "admin";
    const { data: callerProfile } = caller.user
      ? await callerClient.from("admin_users").select("role, active").eq("id", caller.user.id).maybeSingle()
      : { data: null };
    const callerIsAdminFromProfile = callerProfile?.role === "admin" && callerProfile?.active !== false;
    if (!callerIsAdminFromToken && !callerIsAdminFromProfile) {
      return new Response(JSON.stringify({ error: "Accès administrateur requis" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || !["admin", "employe"].includes(role)) {
      return new Response(JSON.stringify({ error: "Données utilisateur invalides" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (error) throw error;

    const { error: profileError } = await supabase.from("admin_users").upsert({
      id: data.user.id,
      name,
      email,
      role,
      active: true,
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ id: data.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
