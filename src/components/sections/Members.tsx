import { Section } from "@/components/Section";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { club } from "@/data/club";
import { Crown, Sparkles } from "lucide-react";

const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

export const Members = () => {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <Section
      id="members"
      eyebrow="Faculty & Team"
      title={<>The minds behind <span className="text-gradient">The AI Wings</span></>}
      description="From faculty mentors to student leaders and curious members — meet the people that make this club take flight."
    >
      {/* Faculty */}
      <div ref={ref} className="scroll-fade grid md:grid-cols-2 gap-5 mb-12">
        {club.hod.map((h) => (
          <div key={h.name} className="rounded-2xl p-6 bg-gradient-card border border-border flex items-center gap-5 hover:border-primary/50 hover:shadow-glow transition-all">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xl shadow-glow">
              {initials(h.name)}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary flex items-center gap-1.5"><Crown className="h-3 w-3" /> Faculty</div>
              <div className="font-display font-semibold text-lg">{h.name}</div>
              <div className="text-sm text-muted-foreground">{h.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaders */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {club.leaders.map((l, i) => (
          <div key={l.name} className="group relative rounded-2xl p-6 bg-gradient-card border border-border overflow-hidden hover:-translate-y-1 transition-all duration-500" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/40 transition-all duration-500" />
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold text-2xl shadow-glow mb-4 group-hover:scale-110 transition-transform">
                {l.initials}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary flex items-center gap-1.5 mb-1"><Sparkles className="h-3 w-3" /> Core Team</div>
              <div className="font-display font-semibold text-xl">{l.name}</div>
              <div className="text-sm text-muted-foreground">{l.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Members grid */}
      <div>
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">Active Members</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {club.members.map((m) => (
            <div key={m.name} className="rounded-xl p-4 glass hover:border-primary/50 hover:bg-primary/5 transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-display font-semibold mb-2">
                {initials(m.name)}
              </div>
              <div className="text-sm font-medium truncate">{m.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{m.role}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
