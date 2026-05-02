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
const normalizeCategory = (c: string): "hod" | "faculty" | "leader" | "member" => {
  const v = (c ?? "").trim().toLowerCase();
  if (v === "hod") return "hod";
  if (["faculty", "mentor", "professor", "teacher"].includes(v)) return "faculty";
  if (["leader", "leaders", "core", "core team", "president", "secretary", "lead"].includes(v)) return "leader";
  return "member";
};

// HOD detection: either category=="hod" OR role text contains "hod" / "head of department"
const isHodMember = (m: { category: string; role: string }) => {
  if (normalizeCategory(m.category) === "hod") return true;
  const r = (m.role ?? "").toLowerCase();
  return /\bhod\b/.test(r) || r.includes("head of department");
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

  // HOD = anyone whose category is "hod" OR whose role mentions HOD/Head of Department
  const hods = team.filter(isHodMember);
  const hodIds = new Set(hods.map(h => h.id));
  const faculty = team.filter(t => !hodIds.has(t.id) && (normalizeCategory(t.category) === "faculty" || normalizeCategory(t.category) === "hod"));
  const leaders = team.filter(t => !hodIds.has(t.id) && normalizeCategory(t.category) === "leader");
  const members = team.filter(t => !hodIds.has(t.id) && normalizeCategory(t.category) === "member");

  // Per-section fallback: only use seed data when that specific section is empty.
  const seedHod = club.hod.filter(h => /\bhod\b/i.test(h.role) || /head of department/i.test(h.role));
  const seedFacultyOnly = club.hod.filter(h => !(/\bhod\b/i.test(h.role) || /head of department/i.test(h.role)));
  const showHods = loaded && hods.length === 0
    ? seedHod.map((h, i) => ({ id: `h${i}`, full_name: h.name, role: h.role, category: "hod", branch: null, year: null, image_url: null, sort_order: i }))
    : hods;
  const showFaculty = loaded && faculty.length === 0
    ? seedFacultyOnly.map((h, i) => ({ id: `f${i}`, full_name: h.name, role: h.role, category: "faculty", branch: null, year: null, image_url: null, sort_order: i }))
    : faculty;
  const showLeaders = loaded && leaders.length === 0
    ? club.leaders.map((l, i) => ({ id: `l${i}`, full_name: l.name, role: l.role, category: "leader", branch: null, year: null, image_url: null, sort_order: i }))
    : leaders;
  const showMembers = loaded && members.length === 0
    ? club.members.map((m, i) => ({ id: `m${i}`, full_name: m.name, role: m.role, category: "member", branch: null, year: null, image_url: null, sort_order: i }))
    : members;

  return (
    <Section
      id="members"
      eyebrow="Faculty & Team"
      title={<>The minds behind <span className="text-gradient">The AI Wings</span></>}
      description="From our HOD and faculty mentors to student leaders and curious members — meet the people that make this club take flight."
    >
      {/* HOD — prominent featured cards */}
      {showHods.length > 0 && (
        <div ref={ref} className="scroll-fade mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
            <Crown className="h-3.5 w-3.5" /> Head of Department
          </div>
          <div className={`grid gap-5 ${showHods.length === 1 ? "md:grid-cols-1 max-w-2xl" : "md:grid-cols-2"}`}>
            {showHods.map((h) => (
              <div key={h.id} className="relative rounded-2xl p-6 bg-gradient-card border-2 border-primary/40 flex items-center gap-5 hover:shadow-glow transition-all overflow-hidden">
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/15 blur-2xl" />
                <SocialLinks linkedin={(h as TeamMember).linkedin_url} instagram={(h as TeamMember).instagram_url} />
                {h.image_url ? (
                  <img src={h.image_url} alt={h.full_name} className="h-28 w-28 rounded-2xl object-cover shadow-glow shrink-0 relative" />
                ) : (
                  <div className="h-28 w-28 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold text-3xl shadow-glow shrink-0 relative">
                    {initials(h.full_name)}
                  </div>
                )}
                <div className="min-w-0 relative">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-primary flex items-center gap-1.5"><Crown className="h-3 w-3" /> HOD</div>
                  <div className="font-display font-bold text-xl break-words">{h.full_name}</div>
                  <div className="text-sm text-muted-foreground">{h.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty */}
      {showFaculty.length > 0 && (
        <div className="scroll-fade grid md:grid-cols-2 gap-5 mb-12">
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
                <div className="font-display font-semibold text-lg break-words">{h.full_name}</div>
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
