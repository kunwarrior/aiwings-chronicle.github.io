import { useEffect, useState } from "react";
import { z } from "zod";
import { Section } from "@/components/Section";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  branch: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.string().trim().max(20).optional().or(z.literal("")),
  event_id: z.string().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

interface EventLite { id: string; title: string; }

export const Register = () => {
  const [events, setEvents] = useState<EventLite[]>([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", branch: "", year: "", event_id: "", message: "" });

  useEffect(() => {
    supabase.from("events").select("id,title").eq("registration_open", true).order("event_date", { ascending: false })
      .then(({ data }) => setEvents((data as EventLite[]) ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const payload = {
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      branch: parsed.data.branch || null,
      year: parsed.data.year || null,
      event_id: parsed.data.event_id || null,
      message: parsed.data.message || null,
    };
    const { error } = await supabase.from("registrations").insert(payload);
    setLoading(false);
    if (error) {
      toast.error("Could not submit. Please try again.");
      return;
    }
    setDone(true);
    toast.success("Welcome aboard! We'll be in touch soon.");
  };

  return (
    <Section
      id="register"
      eyebrow="Join us"
      title={<>Ready to <span className="text-gradient">take flight?</span></>}
      description="Fill the form to join the club or register for an upcoming event. We get back within 48 hours."
    >
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-primary text-primary-foreground p-8 relative overflow-hidden shadow-glow">
          <div className="absolute inset-0 neural-grid opacity-20" />
          <div className="relative">
            <div className="text-xs font-mono uppercase tracking-wider opacity-80 mb-3">What you get</div>
            <h3 className="font-display font-bold text-2xl mb-5">Become an AI Wing</h3>
            <ul className="space-y-3">
              {[
                "Access to all workshops & resources",
                "Project teams every semester",
                "Mentorship from seniors & faculty",
                "Hackathon & competition support",
                "Certificates and recommendation letters",
              ].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-gradient-card border border-border p-6 md:p-8">
          {done ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-display font-semibold text-2xl mb-2">You're in!</h3>
              <p className="text-muted-foreground">We've received your request. The core team will reach out shortly.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Full name *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" required />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" required />
              </div>
              <div>
                <Label>Branch</Label>
                <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="CSE / IT / EC …" />
              </div>
              <div>
                <Label>Year</Label>
                <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {["1st", "2nd", "3rd", "4th"].map(y => <SelectItem key={y} value={y}>{y} year</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {events.length > 0 && (
                <div className="sm:col-span-2">
                  <Label>Register for an event (optional)</Label>
                  <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                    <SelectTrigger><SelectValue placeholder="General club membership" /></SelectTrigger>
                    <SelectContent>
                      {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>Why do you want to join?</Label>
                <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us a little about your interest in AI…" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                  {loading ? "Submitting…" : <>Send Application <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
};
