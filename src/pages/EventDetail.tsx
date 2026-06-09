import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, IndianRupee, Upload, Loader2, CheckCircle2, X, Send, ShieldCheck, LogOut, Mail } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPwd, setAuthPwd] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
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

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Prefill from Google profile
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      full_name: f.full_name || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "",
      email: user.email ?? f.email ?? "",
    }));
  }, [user]);

  // Check duplicate registration
  useEffect(() => {
    if (!user || !id) { setAlreadyRegistered(false); return; }
    supabase.from("registrations").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setAlreadyRegistered(!!data));
  }, [user, id, done]);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = authEmail.trim();
    if (!email) return toast.error("Email daalo");
    if (authPwd.length < 6) return toast.error("Password kam se kam 6 chars ka ho");
    setAuthBusy(true);
    if (authMode === "signup") {
      if (authName.trim().length < 2) { setAuthBusy(false); return toast.error("Apna full name daalo"); }
      const { error } = await supabase.auth.signUp({
        email,
        password: authPwd,
        options: {
          emailRedirectTo: window.location.href,
          data: { full_name: authName.trim() },
        },
      });
      setAuthBusy(false);
      if (error) return toast.error(error.message);
      setSignupSent(true);
      toast.success("Verification email bhej diya hai. Inbox check karo.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: authPwd });
      setAuthBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Signed in!");
    }
  };

  const sendResetLink = async () => {
    const email = authEmail.trim();
    if (!email) return toast.error("Pehle email daalo");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Reset link bhej diya. Inbox check karo.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

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
    if (!event || !user) return;

    const fn = v("full_name");
    if (!fn || fn.length < 2) return toast.error("Please enter your full name");
    const email = (user.email ?? "").trim();
    if (!email) return toast.error("Your account has no email");
    const phone = v("phone");
    if (required.phone !== false && phone.length < 7) return toast.error("Enter a valid phone");
    if (required.branch && !v("branch")) return toast.error("Branch is required");
    if (required.year && !v("year")) return toast.error("Year is required");
    if (required.message && !v("message")) return toast.error("Message is required");

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
      user_id: user.id,
      full_name: fn,
      email,
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
    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        setAlreadyRegistered(true);
        toast.error("You are already registered for this event");
      } else {
        toast.error("Could not submit. Please try again.");
      }
      return;
    }
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

  const renderRegistrationArea = () => {
    if (!event.registration_open) {
      return (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Registrations for this event are currently closed.
        </div>
      );
    }
    if (!authReady) {
      return (
        <div className="rounded-2xl bg-gradient-card border border-border p-10 flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      );
    }
    if (!user) {
      if (signupSent) {
        return (
          <div className="rounded-2xl bg-gradient-card border border-border p-8 md:p-10 text-center max-w-xl mx-auto">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2">Check your email</h2>
            <p className="text-muted-foreground mb-2">
              Humne <span className="text-foreground font-medium">{authEmail}</span> pe verification link bhej diya hai.
            </p>
            <p className="text-muted-foreground text-sm">
              Link click karne ke baad wapas is page pe aao — phir registration form milega.
            </p>
            <button
              type="button"
              onClick={() => { setSignupSent(false); setAuthMode("signin"); }}
              className="text-primary text-sm mt-4 hover:underline"
            >
              Verified ho gaya? Sign in karo
            </button>
          </div>
        );
      }
      return (
        <div className="rounded-2xl bg-gradient-card border border-border p-8 md:p-10 max-w-xl mx-auto">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2">
              {authMode === "signup" ? "Create your account" : "Sign in to register"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Spam aur fake registrations rokne ke liye email verification zaruri hai.
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <Label>Full name</Label>
                <Input value={authName} onChange={(e) => setAuthName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={authPwd} onChange={(e) => setAuthPwd(e.target.value)} required minLength={6} />
              {authMode === "signin" && (
                <button type="button" onClick={sendResetLink} className="text-xs text-primary hover:underline mt-1">
                  Forgot password?
                </button>
              )}
            </div>
            <Button type="submit" disabled={authBusy} size="lg" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : (authMode === "signup" ? "Create account" : "Sign in")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {authMode === "signup" ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}
                className="text-primary hover:underline font-medium"
              >
                {authMode === "signup" ? "Sign in" : "Create account"}
              </button>
            </p>
          </form>
        </div>
      );
    }
    if (alreadyRegistered) {
      return (
        <div className="rounded-2xl bg-gradient-card border border-border p-10 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display font-semibold text-2xl mb-2">You're already registered</h2>
          <p className="text-muted-foreground">Aap is event ke liye already registered ho ({user.email}).</p>
        </div>
      );
    }
    if (done) {
      return (
        <div className="rounded-2xl bg-gradient-card border border-border p-10 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display font-semibold text-2xl mb-2">You're registered!</h2>
          <p className="text-muted-foreground">
            We've received your registration{isPaid ? " and your payment is being verified" : ""}. See you at the event!
          </p>
        </div>
      );
    }
    return (
      <form onSubmit={submit} className="rounded-2xl bg-gradient-card border border-border p-6 md:p-10 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Registration form</div>
            <h2 className="font-display font-bold text-2xl">Reserve your spot</h2>
          </div>
          <div className="inline-flex items-center gap-2 text-xs bg-secondary/60 border border-border rounded-full px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">{user.email}</span>
            <button type="button" onClick={signOut} className="text-destructive hover:underline inline-flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Label>Full name *</Label>
          <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <Label>Email (verified)</Label>
          <Input type="email" value={user.email ?? ""} readOnly className="bg-muted/40 cursor-not-allowed" />
        </div>
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
    );
  };

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

        {renderRegistrationArea()}
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
