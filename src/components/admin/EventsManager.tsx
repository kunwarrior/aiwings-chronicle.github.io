import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageInput } from "@/components/admin/ImageInput";
import { Plus, Trash2, Pencil, X, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

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
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
};

type RequiredFields = {
  full_name: boolean; email: boolean; phone: boolean;
  branch: boolean; year: boolean; message: boolean;
};

type CustomQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
};

interface EventRow {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string | null;
  fee_amount: number | null;
  payment_instructions: string | null;
  payment_qr_url: string | null;
  image_url: string | null;
  is_live: boolean;
  registration_open: boolean;
  required_fields: RequiredFields | null;
  custom_questions: CustomQuestion[] | null;
  created_at: string;
}

const DEFAULT_REQ: RequiredFields = {
  full_name: true, email: true, phone: true, branch: false, year: false, message: false,
};

const FIELD_LABELS: Record<keyof RequiredFields, string> = {
  full_name: "Full name",
  email: "Email",
  phone: "Phone",
  branch: "Branch",
  year: "Year",
  message: "Message / Why join",
};

const fmt = (s: string) => new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const emptyForm = () => ({
  title: "",
  description: "",
  event_date: "",
  venue: "",
  fee_amount: "0",
  payment_instructions: "",
  payment_qr_url: "",
  image_url: "",
  is_live: false,
  registration_open: true,
  required_fields: { ...DEFAULT_REQ },
  custom_questions: [] as CustomQuestion[],
});

export const EventsManager = ({ password }: { password: string }) => {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      const { data } = await call(password, { action: "list", table: "events" });
      setRows((data ?? []) as EventRow[]);
    } catch (e) { toast.error((e as Error).message); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const startEdit = (r: EventRow) => {
    setEditingId(r.id);
    setForm({
      title: r.title ?? "",
      description: r.description ?? "",
      event_date: r.event_date ? new Date(r.event_date).toISOString().slice(0, 16) : "",
      venue: r.venue ?? "",
      fee_amount: String(r.fee_amount ?? 0),
      payment_instructions: r.payment_instructions ?? "",
      payment_qr_url: r.payment_qr_url ?? "",
      image_url: r.image_url ?? "",
      is_live: !!r.is_live,
      registration_open: r.registration_open ?? true,
      required_fields: { ...DEFAULT_REQ, ...(r.required_fields ?? {}) },
      custom_questions: Array.isArray(r.custom_questions) ? r.custom_questions : [],
    });
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm()); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.event_date) {
      toast.error("Please fill title, description and date");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        event_date: new Date(form.event_date).toISOString(),
        venue: form.venue.trim() || null,
        fee_amount: Number(form.fee_amount) || 0,
        payment_instructions: form.payment_instructions.trim() || null,
        payment_qr_url: form.payment_qr_url || null,
        image_url: form.image_url || null,
        is_live: form.is_live,
        registration_open: form.registration_open,
        required_fields: form.required_fields,
        custom_questions: form.custom_questions.filter(q => q.label.trim()),
      };
      if (editingId) {
        await call(password, { action: "update", table: "events", id: editingId, payload });
        toast.success("Event updated");
      } else {
        await call(password, { action: "insert", table: "events", payload });
        toast.success("Event created");
      }
      cancelEdit();
      reload();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try { await call(password, { action: "delete", table: "events", id }); toast.success("Deleted"); reload(); }
    catch (e) { toast.error((e as Error).message); }
  };

  const toggleReq = (k: keyof RequiredFields) =>
    setForm({ ...form, required_fields: { ...form.required_fields, [k]: !form.required_fields[k] } });

  const addQuestion = () => setForm({
    ...form,
    custom_questions: [...form.custom_questions, {
      id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      label: "", type: "text", required: false,
    }],
  });

  const updateQuestion = (idx: number, patch: Partial<CustomQuestion>) => {
    const next = [...form.custom_questions];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, custom_questions: next });
  };

  const removeQuestion = (idx: number) => {
    const next = [...form.custom_questions];
    next.splice(idx, 1);
    setForm({ ...form, custom_questions: next });
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <form onSubmit={submit} className="lg:col-span-3 rounded-2xl bg-gradient-card border border-border p-5 space-y-4 h-fit">
        <div className="font-display font-semibold text-lg flex items-center gap-2">
          {editingId ? <><Pencil className="h-4 w-4 text-primary" /> Edit event</> : <><Plus className="h-4 w-4 text-primary" /> Add new event</>}
        </div>

        <div>
          <Label>Title *</Label>
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <Label>Description *</Label>
          <Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Date & time *</Label>
            <Input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
          </div>
          <div>
            <Label>Venue</Label>
            <Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
          </div>
        </div>
        <ImageInput label="Event poster / image" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />

        <div className="rounded-xl border border-border p-4 space-y-3 bg-background/40">
          <div className="font-display font-semibold text-sm">Payment</div>
          <div>
            <Label>Registration fee (₹) — leave 0 for free</Label>
            <Input type="number" min={0} value={form.fee_amount} onChange={e => setForm({ ...form, fee_amount: e.target.value })} />
          </div>
          {Number(form.fee_amount) > 0 && (
            <>
              <div>
                <Label>Payment instructions (UPI ID / bank / steps)</Label>
                <Textarea rows={3} value={form.payment_instructions} onChange={e => setForm({ ...form, payment_instructions: e.target.value })} />
              </div>
              <ImageInput label="UPI / Payment QR image" value={form.payment_qr_url} onChange={(v) => setForm({ ...form, payment_qr_url: v })} />
            </>
          )}
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3 bg-background/40">
          <div className="font-display font-semibold text-sm">Which details to collect?</div>
          <p className="text-xs text-muted-foreground">Toggle on to make a field required on the registration form. Full name is always required.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {(Object.keys(FIELD_LABELS) as (keyof RequiredFields)[]).map(k => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                <span className="text-sm">{FIELD_LABELS[k]}</span>
                <Switch
                  checked={!!form.required_fields[k]}
                  onCheckedChange={() => toggleReq(k)}
                  disabled={k === "full_name"}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3 bg-background/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-semibold text-sm">Custom questions</div>
              <p className="text-xs text-muted-foreground">Add extra questions specific to this event.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {form.custom_questions.length === 0 && (
            <div className="text-xs text-muted-foreground italic">No custom questions yet.</div>
          )}
          {form.custom_questions.map((q, idx) => (
            <div key={q.id} className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 mt-2 text-muted-foreground" />
                <Input
                  placeholder="Question (e.g. T-shirt size)"
                  value={q.label}
                  onChange={e => updateQuestion(idx, { label: e.target.value })}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(idx)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 pl-6">
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={q.type}
                  onChange={e => updateQuestion(idx, { type: e.target.value as CustomQuestion["type"] })}
                >
                  <option value="text">Short text</option>
                  <option value="textarea">Long text</option>
                  <option value="select">Dropdown</option>
                </select>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={q.required} onCheckedChange={(c) => updateQuestion(idx, { required: c })} />
                  Required
                </label>
                {q.type === "select" && (
                  <Input
                    placeholder="Options, comma separated"
                    value={(q.options ?? []).join(", ")}
                    onChange={e => updateQuestion(idx, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    className="sm:col-span-1"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background/40">
            <div>
              <Label className="cursor-pointer">Registration open</Label>
              <p className="text-xs text-muted-foreground mt-0.5">If off, the event page shows but the form is hidden.</p>
            </div>
            <Switch checked={form.registration_open} onCheckedChange={(c) => setForm({ ...form, registration_open: c })} />
          </div>
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background/40">
            <div>
              <Label className="cursor-pointer">Live now</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Show live popup on home page.</p>
            </div>
            <Switch checked={form.is_live} onCheckedChange={(c) => setForm({ ...form, is_live: c })} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={busy} className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save changes" : "Create event"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2 space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{rows.length} events</div>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            No events yet. Create your first one →
          </div>
        ) : rows.map(r => (
          <div key={r.id} className={`rounded-xl bg-gradient-card border p-4 transition-all ${editingId === r.id ? "border-primary shadow-glow" : "border-border"}`}>
            <div className="flex items-start gap-3">
              {r.image_url && <img src={r.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[10px] font-mono text-primary uppercase">{fmt(r.event_date)}</div>
                  {r.is_live && <span className="text-[10px] font-mono px-1.5 rounded bg-destructive/15 text-destructive">LIVE</span>}
                  {Number(r.fee_amount) > 0 && <span className="text-[10px] font-mono px-1.5 rounded bg-primary/10 text-primary">₹{r.fee_amount}</span>}
                  {!r.registration_open && <span className="text-[10px] font-mono px-1.5 rounded bg-muted text-muted-foreground">CLOSED</span>}
                </div>
                <div className="font-semibold truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{r.description}</div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(r)} className="text-primary hover:bg-primary/10">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
