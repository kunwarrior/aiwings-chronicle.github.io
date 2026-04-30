import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { club } from "@/data/club";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, Linkedin, Instagram } from "lucide-react";

const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  category: string;
  branch: string | null;
  year: string | null;
  image_url: string | null;
  sort_order: number;
  linkedin_url?: string | null;
  instagram_url?: string | null;
}

// Normalize whatever was stored (handles "Faculty", "HOD", "leaders", " Member ", etc.)
const normalizeCategory = (c: string): "faculty" | "leader" | "member" => {
  const v = (c ?? "").trim().toLowerCase();
  if (["faculty", "hod", "mentor", "professor", "teacher"].includes(v)) return "faculty";
  if (["leader", "leaders", "core", "core team", "president", "secretary", "lead"].includes(v)) return "leader";
  return "member";
};

const SocialLinks = ({ linkedin, instagram }: { linkedin?: string | null; instagram?: string | null }) => {
  if (!linkedin && !instagram) return null;
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 transition-all"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 transition-all"
        >
          <Instagram className="h-4 w-4" />
        </a>
      )}
    </div>
  );
};

export const Members = () => {
  const ref = useScrollReveal<HTMLDivElement>();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true });
      setTeam((data ?? []) as TeamMember[]);
      setLoaded(true);
    })();
  }, []);

  const faculty = team.filter(t => normalizeCategory(t.category) === "faculty");
  const leaders = team.filter(t => normalizeCategory(t.category) === "leader");
  const members = team.filter(t => normalizeCategory(t.category) === "member");

  const useFallback = loaded && team.length === 0;
  const showFaculty = useFallback ? club.hod.map((h, i) => ({ id: `f${i}`, full_name: h.name, role: h.role, category: "faculty", branch: null, year: null, image_url: null, sort_order: i })) : faculty;
  const showLeaders = useFallback ? club.leaders.map((l, i) => ({ id: `l${i}`, full_name: l.name, role: l.role, category: "leader", branch: null, year: null, image_url: null, sort_order: i })) : leaders;
  const showMembers = useFallback ? club.members.map((m, i) => ({ id: `m${i}`, full_name: m.name, role: m.role, category: "member", branch: null, year: null, image_url: null, sort_order: i })) : members;

  return (
    <Section
      id="members"
      eyebrow="Faculty & Team"
      title={<>The minds behind <span className="text-gradient">The AI Wings</span></>}
      description="From faculty mentors to student leaders and curious members — meet the people that make this club take flight."
    >
      {/* Faculty */}
      {showFaculty.length > 0 && (
        <div ref={ref} className="scroll-fade grid md:grid-cols-2 gap-5 mb-12">
          {showFaculty.map((h) => (
            <div key={h.id} className="relative rounded-2xl p-6 bg-gradient-card border border-border flex items-center gap-5 hover:border-primary/50 hover:shadow-glow transition-all">
              <SocialLinks linkedin={(h as TeamMember).linkedin_url} instagram={(h as TeamMember).instagram_url} />
              {h.image_url ? (
                <img src={h.image_url} alt={h.full_name} className="h-24 w-24 rounded-2xl object-cover shadow-glow shrink-0" />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold text-2xl shadow-glow shrink-0">
                  {initials(h.full_name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-primary flex items-center gap-1.5"><Crown className="h-3 w-3" /> Faculty</div>
                <div className="font-display font-semibold text-lg">{h.full_name}</div>
                <div className="text-sm text-muted-foreground">{h.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaders */}
      {showLeaders.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {showLeaders.map((l, i) => (
            <div key={l.id} className="group relative rounded-2xl p-6 bg-gradient-card border border-border overflow-hidden hover:-translate-y-1 transition-all duration-500" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/40 transition-all duration-500" />
              <SocialLinks linkedin={(l as TeamMember).linkedin_url} instagram={(l as TeamMember).instagram_url} />
              <div className="relative">
                {l.image_url ? (
                  <img src={l.image_url} alt={l.full_name} className="h-28 w-28 rounded-2xl object-cover shadow-glow mb-4 group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="h-28 w-28 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold text-3xl shadow-glow mb-4 group-hover:scale-110 transition-transform">
                    {initials(l.full_name)}
                  </div>
                )}
                <div className="text-[10px] font-mono uppercase tracking-wider text-primary flex items-center gap-1.5 mb-1"><Sparkles className="h-3 w-3" /> Core Team</div>
                <div className="font-display font-semibold text-xl">{l.full_name}</div>
                <div className="text-sm text-muted-foreground">{l.role}</div>
                {(l.branch || l.year) && (
                  <div className="text-[11px] font-mono text-muted-foreground mt-1">
                    {[l.branch, l.year].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members grid */}
      {showMembers.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">Active Members</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {showMembers.map((m) => (
              <div key={m.id} className="rounded-xl p-4 glass hover:border-primary/50 hover:bg-primary/5 transition-all">
                {m.image_url ? (
                  <img src={m.image_url} alt={m.full_name} className="h-16 w-16 rounded-xl object-cover mb-2" />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display font-semibold text-lg mb-2">
                    {initials(m.full_name)}
                  </div>
                )}
                <div className="text-sm font-medium truncate">{m.full_name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
};
