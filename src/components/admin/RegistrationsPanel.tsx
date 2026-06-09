import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Loader2, Search, ExternalLink, CheckCircle2, XCircle, Clock, Trash2, ChevronRight, Mail, Phone, GraduationCap, Calendar, IndianRupee, ShieldCheck, Copy, Save } from "lucide-react";

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

type CustomQuestion = { id: string; label: string; type?: string };

interface Registration {
  id: string;
  created_at: string;
  user_id: string | null;
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
  custom_responses: Record<string, string> | null;
}

interface EventLite { id: string; title: string; custom_questions: CustomQuestion[] | null }

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
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [r, e] = await Promise.all([
        call(password, { action: "list", table: "registrations" }),
        call(password, { action: "list", table: "events" }),
      ]);
      setRows((r.data ?? []) as Registration[]);
      setEvents(((e.data ?? []) as EventLite[]).map(x => ({
        id: x.id, title: x.title,
        custom_questions: Array.isArray(x.custom_questions) ? x.custom_questions : [],
      })));
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const eventById = useMemo(() => {
    const m = new Map<string, EventLite>();
    events.forEach(e => m.set(e.id, e));
    return m;
  }, [events]);

  const eventTitle = (id: string | null) => id ? (eventById.get(id)?.title ?? "—") : "General membership";

  const updateStatus = async (id: string, payment_status: string) => {
    try {
      await call(password, { action: "update", table: "registrations", id, payload: { payment_status } });
      setRows(rs => rs.map(r => r.id === id ? { ...r, payment_status } : r));
      setSelected(s => s && s.id === id ? { ...s, payment_status } : s);
      toast.success("Status updated");
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    try {
      await call(password, { action: "delete", table: "registrations", id });
      setRows(rs => rs.filter(r => r.id !== id));
      setSelected(null);
      toast.success("Deleted");
    } catch (e) { toast.error((e as Error).message); }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    try {
      await call(password, { action: "update", table: "registrations", id: selected.id, payload: { admin_notes: notesDraft } });
      setRows(rs => rs.map(r => r.id === selected.id ? { ...r, admin_notes: notesDraft } : r));
      setSelected(s => s ? { ...s, admin_notes: notesDraft } : s);
      toast.success("Notes saved");
    } catch (e) { toast.error((e as Error).message); }
    finally { setSavingNotes(false); }
  };

  const openDetail = (r: Registration) => {
    setSelected(r);
    setNotesDraft(r.admin_notes ?? "");
  };

  const filtered = rows.filter(r => {
    if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
    if (eventFilter !== "all") {
      if (eventFilter === "general") { if (r.event_id !== null) return false; }
      else if (r.event_id !== eventFilter) return false;
    }
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [r.full_name, r.email, r.phone, r.transaction_ref, eventTitle(r.event_id)]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
  });

  const exportCSV = () => {
    const headers = [
      "Submitted at", "Full name", "Email", "Phone", "Branch", "Year",
      "Event", "Fee (₹)", "Payment status", "Transaction ref", "Payment proof URL", "Message", "Custom answers",
    ];
    const lines = [headers.join(",")];
    filtered.forEach(r => {
      const ev = r.event_id ? eventById.get(r.event_id) : null;
      const qs = ev?.custom_questions ?? [];
      const customStr = qs.map(q => `${q.label}: ${(r.custom_responses?.[q.id] ?? "")}`).join(" | ");
      lines.push([
        new Date(r.created_at).toLocaleString("en-IN"),
        r.full_name, r.email, r.phone, r.branch ?? "", r.year ?? "",
        eventTitle(r.event_id), r.fee_amount ?? 0, r.payment_status,
        r.transaction_ref ?? "", r.payment_proof_url ?? "", r.message ?? "", customStr,
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

  const selectedEvent = selected?.event_id ? eventById.get(selected.event_id) : null;
  const selectedQuestions = selectedEvent?.custom_questions ?? [];
  const selectedBadge = selected ? (STATUS_BADGE[selected.payment_status] ?? STATUS_BADGE.none) : null;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-card border border-border p-4">
          <div className="text-xs font-mono uppercase text-muted-foreground">Total entries</div>
          <div className="font-display font-bold text-2xl">{filtered.length}</div>
        </div>
        <div className="rounded-xl bg-gradient-card border border-border p-4">
          <div className="text-xs font-mono uppercase text-muted-foreground">Paid</div>
          <div className="font-display font-bold text-2xl text-emerald-500">
            {filtered.filter(r => r.payment_status === "paid").length}
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
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All events" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="general">General membership</SelectItem>
            {events.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
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
        <div className="space-y-2">
          {filtered.map(r => {
            const badge = STATUS_BADGE[r.payment_status] ?? STATUS_BADGE.none;
            const Icon = badge.icon;
            const answersCount = r.custom_responses ? Object.values(r.custom_responses).filter(v => v && String(v).trim()).length : 0;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => openDetail(r)}
                className="w-full text-left rounded-xl bg-gradient-card border border-border p-4 hover:border-primary hover:shadow-glow transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{r.full_name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${badge.cls}`}>
                        <Icon className="h-3 w-3" /> {r.payment_status}
                      </span>
                      {Number(r.fee_amount) > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">₹{r.fee_amount}</span>
                      )}
                      {answersCount > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {answersCount} answer{answersCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {eventTitle(r.event_id)} · {r.email} · {new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && selectedBadge && (() => {
            const Icon = selectedBadge.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center gap-3 flex-wrap">
                    {selected.full_name}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${selectedBadge.cls}`}>
                      <Icon className="h-3 w-3" /> {selected.payment_status}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-3">
                  {/* Account */}
                  <div className="rounded-lg border border-border p-3 bg-secondary/20">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground mb-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified account
                    </div>
                    <div className="text-sm">{selected.email}</div>
                    {selected.user_id && (
                      <div className="text-[10px] font-mono text-muted-foreground mt-1 break-all">UID: {selected.user_id}</div>
                    )}
                    {!selected.user_id && (
                      <div className="text-[10px] text-amber-500 mt-1">Legacy entry (pre-Google login)</div>
                    )}
                  </div>

                  {/* Personal */}
                  <div>
                    <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Personal details</div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <DetailRow icon={Mail} label="Email" value={selected.email} />
                      <DetailRow icon={Phone} label="Phone" value={selected.phone} />
                      {selected.branch && <DetailRow icon={GraduationCap} label="Branch" value={selected.branch} />}
                      {selected.year && <DetailRow icon={GraduationCap} label="Year" value={selected.year} />}
                      <DetailRow icon={Calendar} label="Submitted at" value={new Date(selected.created_at).toLocaleString("en-IN")} />
                      <DetailRow icon={Calendar} label="Event" value={eventTitle(selected.event_id)} />
                    </div>
                    {selected.message && (
                      <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm italic">"{selected.message}"</div>
                    )}
                  </div>

                  {/* Custom answers */}
                  {selectedQuestions.length > 0 && (
                    <div>
                      <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Custom answers</div>
                      <div className="space-y-2">
                        {selectedQuestions.map(q => {
                          const ans = selected.custom_responses?.[q.id];
                          return (
                            <div key={q.id} className="rounded-md border border-border p-3">
                              <div className="text-xs text-muted-foreground mb-1">{q.label}</div>
                              <div className="text-sm whitespace-pre-wrap">{ans && String(ans).trim() ? String(ans) : <span className="text-muted-foreground italic">— no answer —</span>}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  {(Number(selected.fee_amount) > 0 || selected.transaction_ref || selected.payment_proof_url) && (
                    <div>
                      <div className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" /> Payment
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 items-start">
                        <div className="space-y-2 text-sm">
                          <div><span className="text-muted-foreground">Fee:</span> ₹{selected.fee_amount ?? 0}</div>
                          {selected.transaction_ref && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Txn:</span>
                              <span className="font-mono text-xs">{selected.transaction_ref}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(selected.transaction_ref!); toast.success("Copied"); }}
                                className="text-muted-foreground hover:text-primary"
                                aria-label="Copy"
                              ><Copy className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        </div>
                        {selected.payment_proof_url && (
                          <a href={selected.payment_proof_url} target="_blank" rel="noreferrer" className="block">
                            <img src={selected.payment_proof_url} alt="proof" className="w-full max-h-56 object-contain rounded-lg border border-border bg-background hover:border-primary" />
                            <div className="text-[10px] text-primary flex items-center gap-1 mt-1">
                              <ExternalLink className="h-3 w-3" /> View full size
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin notes */}
                  <div>
                    <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Admin notes (private)</div>
                    <Textarea rows={3} value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} placeholder="Internal notes about this entry…" />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="outline" onClick={saveNotes} disabled={savingNotes || notesDraft === (selected.admin_notes ?? "")}>
                        {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        Save notes
                      </Button>
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="border-t border-border pt-4">
                    <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Set payment status</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(["none", "pending", "paid", "failed"] as const).map(s => (
                        <Button
                          key={s}
                          size="sm"
                          variant={selected.payment_status === s ? "default" : "outline"}
                          onClick={() => updateStatus(selected.id, s)}
                        >{s}</Button>
                      ))}
                      <Button size="sm" variant="ghost" onClick={() => remove(selected.id)} className="ml-auto text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
    <div className="min-w-0">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  </div>
);
