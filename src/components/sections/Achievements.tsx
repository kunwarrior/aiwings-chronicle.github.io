import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Ach { id: string; title: string; description: string; achieved_on: string | null; icon: string | null; }

export const Achievements = () => {
  const [items, setItems] = useState<Ach[] | null>(null);
  useEffect(() => {
    supabase.from("achievements").select("*").order("achieved_on", { ascending: false, nullsFirst: false })
      .then(({ data }) => setItems((data as Ach[]) ?? []));
  }, []);

  return (
    <Section
      id="achievements"
      eyebrow="Wins & milestones"
      title={<>Achievements that <span className="text-gradient">make us proud</span></>}
    >
      {items === null ? (
        <div className="grid md:grid-cols-3 gap-5">
          {[0,1,2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Trophy case loading… achievements will appear here.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(a => (
            <div key={a.id} className="group rounded-2xl p-6 bg-gradient-card border border-border hover:border-primary/50 hover:shadow-glow transition-all hover:-translate-y-1 duration-500">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all text-xl">
                {a.icon ?? <Trophy className="h-5 w-5" />}
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{a.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{a.description}</p>
              {a.achieved_on && (
                <div className="text-xs font-mono text-primary uppercase tracking-wider">
                  {new Date(a.achieved_on).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};
