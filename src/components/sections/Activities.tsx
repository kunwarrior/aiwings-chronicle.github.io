import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: string;
  title: string;
  description: string;
  activity_date: string;
  image_url: string | null;
  created_at: string;
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const Activities = () => {
  const [items, setItems] = useState<Activity[] | null>(null);

  useEffect(() => {
    supabase.from("activities").select("*").order("activity_date", { ascending: false }).limit(20)
      .then(({ data }) => setItems((data as Activity[]) ?? []));
  }, []);

  return (
    <Section
      id="activities"
      eyebrow="Daily activity feed"
      title={<>What we did <span className="text-gradient">recently</span></>}
      description="Updated by the admin every day. Workshops, sessions, mini-projects and behind-the-scenes from our community."
    >
      {items === null ? (
        <div className="grid md:grid-cols-2 gap-5">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <div className="font-display text-xl mb-2">First activity coming soon</div>
          <div className="text-sm text-muted-foreground">Admin will post the first daily update here. Check back tomorrow!</div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 md:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent" />
          <div className="space-y-5">
            {items.map((a, i) => (
              <div key={a.id} className="relative pl-12 md:pl-16 group" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="absolute left-0 md:left-2 top-5 h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-gradient-card border border-border p-5 md:p-6 hover:border-primary/50 hover:shadow-glow transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-primary">{fmt(a.activity_date)}</span>
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-2">{a.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{a.description}</p>
                  {a.image_url && (
                    <img src={a.image_url} alt={a.title} loading="lazy" className="mt-4 rounded-xl w-full max-h-96 object-cover" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
};
