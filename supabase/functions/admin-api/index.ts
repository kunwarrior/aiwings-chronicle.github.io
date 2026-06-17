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

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "stats") {
      const [evRes, regRes, teamRes, galRes, actRes, achRes] = await Promise.all([
        supabase.from("events").select("id, title, event_date, is_live, registration_open, fee_amount, created_at"),
        supabase.from("registrations").select("id, event_id, payment_status, fee_amount, created_at, full_name, email"),
        supabase.from("team_members").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("activities").select("id", { count: "exact", head: true }),
        supabase.from("achievements").select("id", { count: "exact", head: true }),
      ]);

      const events = evRes.data ?? [];
      const regs = regRes.data ?? [];
      const now = Date.now();

      const eventStats = {
        total: events.length,
        live: events.filter((e: any) => e.is_live).length,
        upcoming: events.filter((e: any) => new Date(e.event_date).getTime() > now).length,
        past: events.filter((e: any) => new Date(e.event_date).getTime() <= now).length,
        open: events.filter((e: any) => e.registration_open).length,
      };

      const paid = regs.filter((r: any) => r.payment_status === "verified" || r.payment_status === "paid");
      const pending = regs.filter((r: any) => r.payment_status === "pending");
      const rejected = regs.filter((r: any) => r.payment_status === "rejected");
      const free = regs.filter((r: any) => !r.payment_status || r.payment_status === "free" || r.payment_status === "n/a");

      const revenue = paid.reduce((s: number, r: any) => s + Number(r.fee_amount || 0), 0);
      const pendingRevenue = pending.reduce((s: number, r: any) => s + Number(r.fee_amount || 0), 0);

      const dayMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
        dayMap[d] = 0;
      }
      regs.forEach((r: any) => {
        const d = (r.created_at as string).slice(0, 10);
        if (d in dayMap) dayMap[d]++;
      });
      const timeline = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

      const evCount: Record<string, number> = {};
      regs.forEach((r: any) => { evCount[r.event_id] = (evCount[r.event_id] ?? 0) + 1; });
      const topEvents = events
        .map((e: any) => ({ id: e.id, title: e.title, count: evCount[e.id] ?? 0, event_date: e.event_date, is_live: e.is_live }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      const recentRegs = [...regs]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((r: any) => {
          const ev = events.find((e: any) => e.id === r.event_id);
          return { id: r.id, full_name: r.full_name, email: r.email, payment_status: r.payment_status, fee_amount: r.fee_amount, created_at: r.created_at, event_title: ev?.title ?? "—" };
        });

      const storage = { files: 0, bytes: 0 };
      try {
        async function walk(prefix: string) {
          const { data } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
          if (!data) return;
          for (const item of data) {
            if (item.id === null || !item.metadata) {
              await walk(prefix ? `${prefix}/${item.name}` : item.name);
            } else {
              storage.files++;
              storage.bytes += Number(item.metadata?.size ?? 0);
            }
          }
        }
        await walk("");
      } catch (e) { console.error("storage stat err", e); }

      return json({
        data: {
          events: eventStats,
          registrations: {
            total: regs.length,
            paid: paid.length,
            pending: pending.length,
            rejected: rejected.length,
            free: free.length,
          },
          revenue: { collected: revenue, pending: pendingRevenue },
          counts: {
            team: teamRes.count ?? 0,
            gallery: galRes.count ?? 0,
            activities: actRes.count ?? 0,
            achievements: achRes.count ?? 0,
          },
          timeline,
          topEvents,
          recentRegs,
          storage,
        }
      });
    }

    if (!ALLOWED_TABLES.has(table)) return json({ error: "Invalid table" }, 400);

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
