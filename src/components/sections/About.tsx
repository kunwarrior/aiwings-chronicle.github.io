import { Section } from "@/components/Section";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { club } from "@/data/club";
import { Brain, Rocket, Users, Code2 } from "lucide-react";

const PILLARS = [
  { icon: Brain, title: "Learn", desc: "Workshops on ML, deep learning, vision and LLMs led by seniors and industry mentors." },
  { icon: Code2, title: "Build", desc: "Real projects every semester — from research notebooks to deployed AI products." },
  { icon: Users, title: "Collaborate", desc: "A welcoming community across branches, years and skill levels." },
  { icon: Rocket, title: "Compete", desc: "Hackathons, Kaggle sprints and inter-college events to push limits." },
];

export const About = () => {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <Section
      id="about"
      eyebrow="Who we are"
      title={<>A flock of curious minds <span className="text-gradient">building AI</span></>}
      description={club.about}
    >
      <div ref={ref} className="scroll-fade grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PILLARS.map((p, i) => (
          <div
            key={p.title}
            className="group relative rounded-2xl p-6 bg-gradient-card border border-border hover:border-primary/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-glow"
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <p.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display font-semibold text-xl mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-card border border-border p-8">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-3">Mission</div>
          <ul className="space-y-3">
            {club.mission.map((m) => (
              <li key={m} className="flex items-start gap-3 text-foreground/90">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-neural-pulse" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-gradient-primary p-8 text-primary-foreground shadow-glow relative overflow-hidden">
          <div className="absolute inset-0 neural-grid opacity-20" />
          <div className="relative">
            <div className="text-xs font-mono uppercase tracking-wider opacity-80 mb-3">Branch</div>
            <div className="font-display text-2xl font-bold mb-2">{club.branch}</div>
            <div className="text-sm opacity-90">{club.college}</div>
          </div>
        </div>
      </div>
    </Section>
  );
};
