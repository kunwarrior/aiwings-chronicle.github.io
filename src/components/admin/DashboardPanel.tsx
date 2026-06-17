import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Calendar, Users, IndianRupee, HardDrive, Image as ImageIcon, Trophy, UserSquare2, Activity, TrendingUp, RefreshCw, Radio, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

interface Stats {
  events: { total: number; live: number; upcoming: number; past: number; open: number };
  registrations: { total: number; paid: number; pending: number; rejected: number; free: number };
  revenue: { collected: number; pending: number };
  counts: { team: number; gallery: number; activities: number; achievements: number };
  timeline: { date: string; count: number }[];
  topEvents: { id: string; title: string; count: number; event_date: string; is_live: boolean }[];
  recentRegs: { id: string; full_name: string; email: string; payment_status: string | null; fee_amount: number | null; created_at: string; event_title: string }[];
  storage: { files: number; bytes: number };
}

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const StatCard = ({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub?: string; accent?: string }) => (
  <div className="rounded-2xl bg-gradient-card border border-border p-5 relative overflow-hidden group hover:border-primary/40 transition-all">
    <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${accent ?? "bg-primary"}`} />
    <div className="flex items-start justify-between mb-3">
      <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="font-display font-bold text-3xl">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

const statusBadge = (s: string | null) => {
  const map: Record<string, string> = {
    verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const cls = map[s ?? ""] ?? "bg-muted text-muted-foreground border-border";
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${cls}`}>{s ?? "free"}</span>;
};

export const DashboardPanel = ({ password }: { password: string }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "stats" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setStats(json.data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!stats) return null;

  const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const storagePct = Math.min(100, (stats.storage.bytes / (1024 * 1024 * 1024)) * 100); // % of 1 GB

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Overview</h2>
          <p className="text-sm text-muted-foreground">Sab kuch ek jagah — live snapshot of your club.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Events" value={stats.events.total} sub={`${stats.events.live} live · ${stats.events.upcoming} upcoming`} />
        <StatCard icon={Users} label="Registrations" value={stats.registrations.total} sub={`${stats.registrations.paid} paid · ${stats.registrations.pending} pending`} accent="bg-emerald-500" />
        <StatCard icon={IndianRupee} label="Revenue Collected" value={`₹${stats.revenue.collected.toLocaleString("en-IN")}`} sub={`₹${stats.revenue.pending.toLocaleString("en-IN")} pending`} accent="bg-amber-500" />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(stats.storage.bytes)} sub={`${stats.storage.files} files`} accent="bg-violet-500" />
      </div>

      {/* Secondary counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={UserSquare2} label="Team Members" value={stats.counts.team} />
        <StatCard icon={ImageIcon} label="Gallery Items" value={stats.counts.gallery} />
        <StatCard icon={Activity} label="Activities" value={stats.counts.activities} />
        <StatCard icon={Trophy} label="Achievements" value={stats.counts.achievements} />
      </div>

      {/* Storage bar */}
      <div className="rounded-2xl bg-gradient-card border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold flex items-center gap-2"><HardDrive className="h-4 w-4 text-primary" /> Storage usage</div>
          <div className="text-xs font-mono text-muted-foreground">{formatBytes(stats.storage.bytes)} / 1 GB</div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${storagePct}%` }} />
        </div>
        {storagePct > 80 && (
          <div className="text-xs text-amber-400 mt-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Storage 80%+ full. Delete old events to free space.</div>
        )}
      </div>

      {/* Chart: registrations over time */}
      <div className="rounded-2xl bg-gradient-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="font-semibold">Registrations — last 30 days</div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.timeline}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top events */}
        <div className="rounded-2xl bg-gradient-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            <div className="font-semibold">Top events by registrations</div>
          </div>
          {stats.topEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No events yet.</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topEvents} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <YAxis dataKey="title" type="category" width={110} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickFormatter={(t: string) => t.length > 16 ? t.slice(0, 15) + "…" : t} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="rounded-2xl bg-gradient-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee className="h-4 w-4 text-primary" />
            <div className="font-semibold">Registration breakdown</div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Paid / Verified", value: stats.registrations.paid, icon: CheckCircle2, color: "text-emerald-400", bar: "bg-emerald-500" },
              { label: "Pending verification", value: stats.registrations.pending, icon: Clock, color: "text-amber-400", bar: "bg-amber-500" },
              { label: "Rejected", value: stats.registrations.rejected, icon: AlertCircle, color: "text-red-400", bar: "bg-red-500" },
              { label: "Free / N/A", value: stats.registrations.free, icon: Users, color: "text-muted-foreground", bar: "bg-muted-foreground" },
            ].map((row) => {
              const pct = stats.registrations.total ? (row.value / stats.registrations.total) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`flex items-center gap-2 ${row.color}`}><row.icon className="h-3.5 w-3.5" />{row.label}</span>
                    <span className="font-mono">{row.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${row.bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Live</div>
              <div className="font-bold flex items-center justify-center gap-1"><Radio className="h-3 w-3 text-red-400" />{stats.events.live}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Open</div>
              <div className="font-bold">{stats.events.open}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Past</div>
              <div className="font-bold">{stats.events.past}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent registrations */}
      <div className="rounded-2xl bg-gradient-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <div className="font-semibold">Recent registrations</div>
        </div>
        {stats.recentRegs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No registrations yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-mono uppercase text-muted-foreground border-b border-border">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Event</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-right py-2 px-2">Fee</th>
                  <th className="text-right py-2 px-2">When</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegs.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-2">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{r.event_title}</td>
                    <td className="py-2 px-2">{statusBadge(r.payment_status)}</td>
                    <td className="py-2 px-2 text-right font-mono">{r.fee_amount ? `₹${r.fee_amount}` : "—"}</td>
                    <td className="py-2 px-2 text-right text-xs text-muted-foreground">{fmt(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
