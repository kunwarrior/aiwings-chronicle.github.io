import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_TABLES = new Set(["activities", "events", "gallery", "achievements", "registrations"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const password = req.headers.get("x-admin-password") ?? "";
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { action, table, payload, id } = body ?? {};

    if (action === "verify") return json({ ok: true });

    if (!ALLOWED_TABLES.has(table)) return json({ error: "Invalid table" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "list") {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data });
    }
    if (action === "insert") {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return json({ data });
    }
    if (action === "update") {
      const { data, error } = await supabase.from(table).update(payload).eq("id", id).select().single();
      if (error) throw error;
      return json({ data });
    }
    if (action === "delete") {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
