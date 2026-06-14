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
const BUCKET = "uploads";

const ALLOWED_TABLES = new Set(["activities", "events", "gallery", "achievements", "registrations", "team_members", "site_settings"]);

// Extract storage path from a public URL like
// https://<proj>.supabase.co/storage/v1/object/public/uploads/<path>
function extractStoragePath(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.substring(idx + marker.length).split("?")[0];
  return path || null;
}

async function removeFiles(supabase: any, urls: unknown[]) {
  const paths = urls.map(extractStoragePath).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
}

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
      // Cascade-delete storage files associated with the row(s)
      try {
        if (table === "events") {
          const { data: ev } = await supabase
            .from("events")
            .select("image_url, payment_qr_url")
            .eq("id", id)
            .maybeSingle();
          const { data: regs } = await supabase
            .from("registrations")
            .select("id, payment_proof_url")
            .eq("event_id", id);

          const urls: unknown[] = [];
          if (ev) urls.push(ev.image_url, ev.payment_qr_url);
          if (regs) for (const r of regs) urls.push(r.payment_proof_url);
          await removeFiles(supabase, urls);

          // Delete child registrations first (in case no FK cascade)
          if (regs && regs.length > 0) {
            await supabase.from("registrations").delete().eq("event_id", id);
          }
        } else if (table === "registrations") {
          const { data: reg } = await supabase
            .from("registrations")
            .select("payment_proof_url")
            .eq("id", id)
            .maybeSingle();
          if (reg) await removeFiles(supabase, [reg.payment_proof_url]);
        } else if (table === "gallery") {
          const { data: g } = await supabase
            .from("gallery")
            .select("image_url")
            .eq("id", id)
            .maybeSingle();
          if (g) await removeFiles(supabase, [g.image_url]);
        } else if (table === "team_members") {
          const { data: t } = await supabase
            .from("team_members")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (t) {
            const urls = Object.entries(t)
              .filter(([k, v]) => typeof v === "string" && (k.includes("image") || k.includes("photo") || k.includes("avatar")))
              .map(([, v]) => v);
            await removeFiles(supabase, urls);
          }
        } else if (table === "activities" || table === "achievements") {
          const { data: row } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
          if (row) {
            const urls = Object.entries(row)
              .filter(([k, v]) => typeof v === "string" && (k.includes("image") || k.includes("url")) && (v as string).includes("/storage/"))
              .map(([, v]) => v);
            await removeFiles(supabase, urls);
          }
        }
      } catch (cleanupErr) {
        console.error("Storage cleanup error:", cleanupErr);
        // continue with row deletion regardless
      }

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
