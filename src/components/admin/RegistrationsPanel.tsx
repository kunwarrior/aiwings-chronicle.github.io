import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Loader2, Search, ExternalLink, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

const call = async (password: string, body: Record<string, unknown>) => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Request failed");
  return j;
};

interface Registration {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  branch: string | null;
  year: string | null;
  event_id: string | null;
  message: string | null;
  fee_amount: number | null;
  payment_status: string;
  payment_method: string | null;
  transaction_ref: string | null;
  payment_proof_url: string | null;
  admin_notes: string | null;
}

interface EventLite { id: string; title: string }

const STATUS_BADGE: Record<string, { cls: string; icon: typeof Clock }> = {
  none:    { cls: "bg-muted text-muted-foreground",         icon: Clock },
  pending: { cls: "bg-amber-500/15 text-amber-500",         icon: Clock },
  paid:    { cls: "bg-emerald-500/15 text-emerald-500",     icon: CheckCircle2 },
  failed:  { cls: "bg-destructive/15 text-destructive",     icon: XCircle },
};

const csvEscape = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const RegistrationsPanel = ({ password }: { password: string }) => {
  const [rows, setRows] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const reload = async () => {
    setLoading(true);
    try {
      const [r, e] = await Promise.all([
        call(password, { action: "list", table: "registrations" }),
        call(password, { action: "list", table: "events" }),
      ]);
      setRows((r.data ?? []) as Registration[]);
      setEvents(((e.data ?? []) as EventLite[]).map(x => ({ id: x.id, title: x.title })));
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const eventTitle = (id: string | null) => id ? (events.find(e => e.id === id)?.title ?? "—") : "General membership";

  const updateStatus = async (id: string, payment_status: string) => {
    try {
      await call(password, { action: "update", table: "registrations", id, payload: { payment_status } });
      setRows(rows.map(r => r.id === id ? { ...r, payment_status } : r));
      toast.success("Status updated");
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    try {
      await call(password, { action: "delete", table: "registrations", id });
      setRows(rows.filter(r => r.id !== id));
      toast.success("Deleted");
    } catch (e) { toast.error((e as Error).message); }
  };

  const filtered = rows.filter(r => {
    if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [r.full_name, r.email, r.phone, r.transaction_ref, eventTitle(r.event_id)]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
  });

  const exportCSV = () => {
    const headers = [
      "Submitted at", "Full name", "Email", "Phone", "Branch", "Year",
      "Event", "Fee (₹)", "Payment status", "Transaction ref", "Payment proof URL", "Message",
    ];
    const lines = [headers.join(",")];
    filtered.forEach(r => {
      lines.push([
        new Date(r.created_at).toLocaleString("en-IN"),
        r.full_name, r.email, r.phone, r.branch ?? "", r.year ?? "",
        eventTitle(r.event_id), r.fee_amount ?? 0, r.payment_status,
        r.transaction_ref ?? "", r.payment_proof_url ?? "", r.message ?? "",
      ].map(csvEscape).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} entries`);
  };

  const totalRevenue = filtered
    .filter(r => r.payment_status === "paid")
    .reduce((sum, r) => sum + Number(r.fee_amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-card border border-border p-4">
          <div className="text-xs font-mono uppercase text-muted-foreground">Total entries</div>
          <div className="font-display font-bold text-2xl">{rows.length}</div>
        </div>
        <div className="rounded-xl bg-gradient-card border border-border p-4">
          <div className="text-xs font-mono uppercase text-muted-foreground">Paid</div>
          <div className="font-display font-bold text-2xl text-emerald-500">
            {rows.filter(r => r.payment_status === "paid").length}
          </div>
        </div>
        <div className="rounded-xl bg-gradient-card border border-border p-4">
          <div className="text-xs font-mono uppercase text-muted-foreground">Revenue (filtered)</div>
          <div className="font-display font-bold text-2xl text-primary">₹{totalRevenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search name, email, phone, txn ref…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="none">No payment</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV / Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground p-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          No registrations match the filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const badge = STATUS_BADGE[r.payment_status] ?? STATUS_BADGE.none;
            const Icon = badge.icon;
            return (
              <div key={r.id} className="rounded-xl bg-gradient-card border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold">{r.full_name}</div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${badge.cls}`}>
                        <Icon className="h-3 w-3" /> {r.payment_status}
                      </span>
                      {Number(r.fee_amount) > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          ₹{r.fee_amount}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {r.email} · {r.phone}
                      {r.branch ? ` · ${r.branch}` : ""}{r.year ? ` · ${r.year}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <strong>Event:</strong> {eventTitle(r.event_id)}
                    </div>
                    {r.transaction_ref && (
                      <div className="text-xs mt-1"><strong>Txn:</strong> <span className="font-mono">{r.transaction_ref}</span></div>
                    )}
                    {r.message && <div className="text-sm italic mt-1 text-muted-foreground">"{r.message}"</div>}
                    <div className="text-[10px] font-mono text-muted-foreground mt-2">
                      {new Date(r.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {r.payment_proof_url && (
                      <a
                        href={r.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img src={r.payment_proof_url} alt="proof" className="h-20 w-20 object-cover rounded-lg border border-border hover:border-primary" />
                        <div className="text-[10px] text-primary flex items-center gap-1 mt-1 justify-end">
                          <ExternalLink className="h-3 w-3" /> View full
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                  <span className="text-xs text-muted-foreground">Set status:</span>
                  {(["none", "pending", "paid", "failed"] as const).map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={r.payment_status === s ? "default" : "outline"}
                      onClick={() => updateStatus(r.id, s)}
                      className="h-7 text-xs"
                    >
                      {s}
                    </Button>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="ml-auto text-destructive hover:bg-destructive/10 h-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
