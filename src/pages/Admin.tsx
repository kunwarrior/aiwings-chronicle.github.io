import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2, Lock, Sparkles, Pencil, X } from "lucide-react";

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

interface Row { id: string; created_at: string; [k: string]: unknown }

const TableManager = ({ password, table, fields, listRender }: {
  password: string;
  table: string;
  fields: { key: string; label: string; type?: "text" | "textarea" | "date" | "datetime" | "url" | "number"; required?: boolean }[];
  listRender: (r: Row) => React.ReactNode;
}) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = async () => {
    try {
      const { data } = await call(password, { action: "list", table });
      setRows(data ?? []);
    } catch (e) { toast.error((e as Error).message); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [table]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach(f => {
        const v = form[f.key];
        if (v !== undefined && v !== "") {
          // sort_order is integer
          payload[f.key] = f.key === "sort_order" ? Number(v) : v;
        } else if (editingId) {
          // when editing, allow clearing optional fields by sending null
          if (!f.required) payload[f.key] = null;
        }
      });
      if (editingId) {
        await call(password, { action: "update", table, id: editingId, payload });
        toast.success("Updated");
      } else {
        await call(password, { action: "insert", table, payload });
        toast.success("Added");
      }
      setForm({}); setEditingId(null);
      reload();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const startEdit = (r: Row) => {
    const next: Record<string, string> = {};
    fields.forEach(f => {
      const v = r[f.key];
      if (v === null || v === undefined) return;
      if (f.type === "date" && typeof v === "string") next[f.key] = v.slice(0, 10);
      else if (f.type === "datetime" && typeof v === "string") next[f.key] = new Date(v).toISOString().slice(0, 16);
      else next[f.key] = String(v);
    });
    setForm(next); setEditingId(r.id);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const cancelEdit = () => { setForm({}); setEditingId(null); };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try { await call(password, { action: "delete", table, id }); toast.success("Deleted"); reload(); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <form onSubmit={submit} className="lg:col-span-2 rounded-2xl bg-gradient-card border border-border p-5 space-y-3 h-fit sticky top-6">
        <div className="font-display font-semibold text-lg flex items-center gap-2">
          {editingId ? <><Pencil className="h-4 w-4 text-primary" /> Edit entry</> : <><Plus className="h-4 w-4 text-primary" /> Add new</>}
        </div>
        {fields.map(f => (
          <div key={f.key}>
            <Label>{f.label}{f.required && " *"}</Label>
            {f.type === "textarea" ? (
              <Textarea rows={3} value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
            ) : (
              <Input
                type={f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                value={form[f.key] ?? ""}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                required={f.required}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy} className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save changes" : "Add"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      <div className="lg:col-span-3 space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{rows.length} entries</div>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            Nothing here yet. Use the form to add the first one.
          </div>
        ) : rows.map(r => (
          <div key={r.id} className={`rounded-xl bg-gradient-card border p-4 flex items-start justify-between gap-3 transition-all ${editingId === r.id ? "border-primary shadow-glow" : "border-border"}`}>
            <div className="flex-1 min-w-0">{listRender(r)}</div>
            <div className="flex flex-col gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => startEdit(r)} className="text-primary hover:bg-primary/10">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Admin = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem("aiw-admin") ?? "");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (password && !authed) {
      // try silent verify
      (async () => {
        try { await call(password, { action: "verify" }); setAuthed(true); }
        catch { sessionStorage.removeItem("aiw-admin"); setPassword(""); }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await call(password, { action: "verify" });
      sessionStorage.setItem("aiw-admin", password);
      setAuthed(true);
      toast.success("Welcome, admin");
    } catch (err) {
      const msg = (err as Error).message;
      toast.error(msg === "Unauthorized" ? "Wrong password — try again" : msg);
    }
    finally { setLoading(false); }
  };

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 neural-grid opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
        <form onSubmit={login} className="w-full max-w-md rounded-2xl glass backdrop-blur-xl p-8 shadow-glow">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"><ArrowLeft className="h-3 w-3" /> Back to site</Link>
          <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-4 shadow-glow">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter the admin password to manage activities, events, gallery and registrations.</p>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          <Button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
          </Button>
        </form>
      </main>
    );
  }

  const fmt = (s: string) => new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="min-h-screen py-10">
      <div className="container-x">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"><ArrowLeft className="h-3 w-3" /> Back to site</Link>
            <h1 className="font-display font-bold text-3xl flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> Admin Console</h1>
          </div>
          <Button variant="outline" onClick={() => { sessionStorage.removeItem("aiw-admin"); setAuthed(false); setPassword(""); }}>
            Sign out
          </Button>
        </div>

        <Tabs defaultValue="activities">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <TableManager
              password={password}
              table="activities"
              fields={[
                { key: "title", label: "Title", required: true },
                { key: "description", label: "Description", type: "textarea", required: true },
                { key: "activity_date", label: "Date", type: "date", required: true },
                { key: "image_url", label: "Image URL (optional)", type: "url" },
              ]}
              listRender={(r) => (
                <div>
                  <div className="text-xs font-mono text-primary uppercase">{new Date(r.activity_date as string).toLocaleDateString("en-IN")}</div>
                  <div className="font-semibold">{String(r.title)}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{String(r.description)}</div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="events">
            <TableManager
              password={password}
              table="events"
              fields={[
                { key: "title", label: "Title", required: true },
                { key: "description", label: "Description", type: "textarea", required: true },
                { key: "event_date", label: "Date & Time", type: "datetime", required: true },
                { key: "venue", label: "Venue" },
                { key: "image_url", label: "Image URL (optional)", type: "url" },
              ]}
              listRender={(r) => (
                <div>
                  <div className="text-xs font-mono text-primary uppercase">{fmt(r.event_date as string)}</div>
                  <div className="font-semibold">{String(r.title)}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{String(r.description)}</div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="team">
            <TableManager
              password={password}
              table="team_members"
              fields={[
                { key: "full_name", label: "Full name", required: true },
                { key: "role", label: "Role / Title", required: true },
                { key: "category", label: "Category (faculty / leader / member)", required: true },
                { key: "branch", label: "Branch (optional)" },
                { key: "year", label: "Year (optional)" },
                { key: "image_url", label: "Photo URL (optional)", type: "url" },
                { key: "sort_order", label: "Sort order (number, optional)", type: "number" },
              ]}
              listRender={(r) => (
                <div className="flex gap-3 items-center">
                  {r.image_url ? (
                    <img src={r.image_url as string} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-display font-semibold text-sm">
                      {String(r.full_name).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-mono text-primary uppercase">{String(r.category)}</div>
                    <div className="font-semibold">{String(r.full_name)}</div>
                    <div className="text-sm text-muted-foreground">{String(r.role)}</div>
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="gallery">
            <TableManager
              password={password}
              table="gallery"
              fields={[
                { key: "title", label: "Title", required: true },
                { key: "image_url", label: "Image URL", type: "url", required: true },
                { key: "caption", label: "Caption" },
              ]}
              listRender={(r) => (
                <div className="flex gap-3">
                  <img src={r.image_url as string} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div>
                    <div className="font-semibold">{String(r.title)}</div>
                    <div className="text-sm text-muted-foreground">{String(r.caption ?? "")}</div>
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="achievements">
            <TableManager
              password={password}
              table="achievements"
              fields={[
                { key: "title", label: "Title", required: true },
                { key: "description", label: "Description", type: "textarea", required: true },
                { key: "achieved_on", label: "Date", type: "date" },
                { key: "icon", label: "Emoji icon (e.g. 🏆)" },
              ]}
              listRender={(r) => (
                <div>
                  <div className="font-semibold">{String(r.icon ?? "🏆")} {String(r.title)}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{String(r.description)}</div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="registrations">
            <TableManager
              password={password}
              table="registrations"
              fields={[
                { key: "full_name", label: "Full name", required: true },
                { key: "email", label: "Email", required: true },
                { key: "phone", label: "Phone", required: true },
              ]}
              listRender={(r) => (
                <div>
                  <div className="font-semibold">{String(r.full_name)}</div>
                  <div className="text-sm text-muted-foreground">
                    {String(r.email)} · {String(r.phone)}
                    {r.branch ? ` · ${r.branch}` : ""}
                    {r.year ? ` · ${r.year}` : ""}
                  </div>
                  {r.message ? <div className="text-sm mt-1 italic">"{String(r.message)}"</div> : null}
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">{fmt(r.created_at)}</div>
                </div>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Admin;
