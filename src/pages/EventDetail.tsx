import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, IndianRupee, Upload, Loader2, CheckCircle2, X, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type RequiredFields = {
  full_name?: boolean; email?: boolean; phone?: boolean;
  branch?: boolean; year?: boolean; message?: boolean;
};

type CustomQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  options?: string[];
};

interface EventRow {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string | null;
  image_url: string | null;
  fee_amount: number | null;
  payment_instructions: string | null;
  payment_qr_url: string | null;
  required_fields: RequiredFields | null;
  custom_questions: CustomQuestion[] | null;
  registration_open: boolean;
}

const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

const DEFAULT_REQ: RequiredFields = { full_name: true, email: true, phone: true };

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRow | null | undefined>(undefined);
  const [lightbox, setLightbox] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    supabase.from("events").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setEvent((data as unknown as EventRow | null) ?? null));
  }, [id]);

  const required: RequiredFields = useMemo(() => ({
    ...DEFAULT_REQ,
    ...(event?.required_fields ?? {}),
  }), [event]);

  const questions: CustomQuestion[] = useMemo(
    () => Array.isArray(event?.custom_questions) ? event!.custom_questions : [],
    [event]
  );

  const fee = Number(event?.fee_amount ?? 0);
  const isPaid = fee > 0;

  const handleProofUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `payment-proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      setProofUrl(data.publicUrl);
      toast.success("Screenshot uploaded");
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const v = (k: string) => (form[k] ?? "").trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    // Validate built-in fields
    const fn = v("full_name");
    if (!fn || fn.length < 2) return toast.error("Please enter your full name");
    const email = v("email");
    if (required.email !== false && !/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email");
    const phone = v("phone");
    if (required.phone !== false && phone.length < 7) return toast.error("Enter a valid phone");
    if (required.branch && !v("branch")) return toast.error("Branch is required");
    if (required.year && !v("year")) return toast.error("Year is required");
    if (required.message && !v("message")) return toast.error("Message is required");

    // Validate custom questions
    for (const q of questions) {
      if (q.required && !(answers[q.id] ?? "").trim()) {
        return toast.error(`Please answer: ${q.label}`);
      }
    }

    if (isPaid && !proofUrl && !v("transaction_ref")) {
      return toast.error("Upload payment screenshot or enter transaction reference");
    }

    setSubmitting(true);
    const payload = {
      full_name: fn,
      email: email || `noemail-${Date.now()}@noemail.local`,
      phone: phone || "0000000",
      branch: v("branch") || null,
      year: v("year") || null,
      message: v("message") || null,
      event_id: event.id,
      fee_amount: fee || 0,
      payment_status: isPaid ? "pending" : "none",
      transaction_ref: v("transaction_ref") || null,
      payment_proof_url: proofUrl || null,
      custom_responses: answers,
    };
    const { error } = await supabase.from("registrations").insert(payload);
    setSubmitting(false);
    if (error) { toast.error("Could not submit. Please try again."); return; }
    setDone(true);
    toast.success("Registration submitted!");
  };

  if (event === undefined) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container-x pt-32 pb-20 space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      </main>
    );
  }

  if (event === null) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container-x pt-32 pb-20 text-center">
          <h1 className="font-display text-3xl mb-3">Event not found</h1>
          <Link to="/#events" className="text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back to events</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="container-x pt-28 pb-20">
        <Link to="/#events" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to events
        </Link>

        <article className="rounded-3xl overflow-hidden bg-gradient-card border border-border shadow-card mb-10">
          {event.image_url ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="block w-full aspect-[16/7] overflow-hidden group"
              aria-label="View event poster"
            >
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </button>
          ) : (
            <div className="aspect-[16/7] bg-gradient-primary relative overflow-hidden">
              <div className="absolute inset-0 neural-grid opacity-30" />
            </div>
          )}
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono uppercase tracking-wider text-primary mb-3">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {fmt(event.event_date)}</span>
              {event.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {event.venue}</span>}
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary"><IndianRupee className="h-3 w-3" />{fee}</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Free</span>
              )}
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl mb-4">{event.title}</h1>
            <p className="text-muted-foreground whitespace-pre-wrap text-base md:text-lg leading-relaxed">{event.description}</p>
          </div>
        </article>

        {!event.registration_open ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Registrations for this event are currently closed.
          </div>
        ) : done ? (
          <div className="rounded-2xl bg-gradient-card border border-border p-10 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="font-display font-semibold text-2xl mb-2">You're registered!</h2>
            <p className="text-muted-foreground">
              We've received your registration{isPaid ? " and your payment is being verified" : ""}. See you at the event!
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl bg-gradient-card border border-border p-6 md:p-10 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 mb-2">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Registration form</div>
              <h2 className="font-display font-bold text-2xl">Reserve your spot</h2>
            </div>

            <div className="sm:col-span-2">
              <Label>Full name *</Label>
              <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            {required.email !== false && (
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            )}
            {required.phone !== false && (
              <div>
                <Label>Phone *</Label>
                <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
            )}
            {required.branch && (
              <div>
                <Label>Branch *</Label>
                <Input value={form.branch ?? ""} onChange={(e) => setForm({ ...form, branch: e.target.value })} required />
              </div>
            )}
            {required.year && (
              <div>
                <Label>Year *</Label>
                <Select value={form.year ?? ""} onValueChange={(val) => setForm({ ...form, year: val })}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {["1st", "2nd", "3rd", "4th"].map(y => <SelectItem key={y} value={y}>{y} year</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {required.message && (
              <div className="sm:col-span-2">
                <Label>Message *</Label>
                <Textarea rows={3} value={form.message ?? ""} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
            )}

            {questions.map((q) => (
              <div key={q.id} className="sm:col-span-2">
                <Label>{q.label}{q.required && " *"}</Label>
                {q.type === "textarea" ? (
                  <Textarea rows={3} value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} required={q.required} />
                ) : q.type === "select" ? (
                  <Select value={answers[q.id] ?? ""} onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {(q.options ?? []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} required={q.required} />
                )}
              </div>
            ))}

            {isPaid && (
              <div className="sm:col-span-2 rounded-xl border border-primary/40 bg-primary/5 p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <IndianRupee className="h-4 w-4" />
                  <span className="font-display font-semibold">Payment required: ₹{fee}</span>
                </div>
                {event.payment_qr_url && (
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <img src={event.payment_qr_url} alt="Payment QR" className="h-48 w-48 rounded-lg border border-border bg-background object-contain p-2" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Scan to pay ₹{fee}</p>
                      <p>Open any UPI app, scan this QR, complete the payment and upload the screenshot below.</p>
                    </div>
                  </div>
                )}
                {event.payment_instructions && (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {event.payment_instructions}
                  </div>
                )}
                <div>
                  <Label>Transaction / UPI Reference</Label>
                  <Input
                    value={form.transaction_ref ?? ""}
                    onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })}
                    placeholder="e.g. UPI ref, txn ID"
                  />
                </div>
                <div>
                  <Label>Payment screenshot</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm hover:border-primary transition-colors">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {proofUrl ? "Replace screenshot" : "Choose image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleProofUpload(e.target.files[0])}
                      />
                    </label>
                    {proofUrl && <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View uploaded</a>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">PNG/JPG, up to 5 MB. Provide either screenshot or transaction reference.</p>
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting || uploading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                {submitting ? "Submitting…" : <>Confirm Registration <Send className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          </form>
        )}
      </div>

      {lightbox && event.image_url && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-secondary"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={event.image_url} alt={event.title} className="max-h-full max-w-full rounded-xl shadow-glow" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <Footer />
    </main>
  );
};

export default EventDetail;
