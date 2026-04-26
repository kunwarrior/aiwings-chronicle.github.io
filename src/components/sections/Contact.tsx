import { Section } from "@/components/Section";
import { club } from "@/data/club";
import { Mail, Instagram, Linkedin, MapPin } from "lucide-react";

export const Contact = () => {
  return (
    <Section
      id="contact"
      eyebrow="Reach us"
      title={<>Let's <span className="text-gradient">connect</span></>}
      description="Questions, collabs, sponsorships — we'd love to hear from you."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href={`mailto:${club.socials.email}`} className="group rounded-2xl p-6 bg-gradient-card border border-border hover:border-primary/50 hover:shadow-glow transition-all">
          <Mail className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Email</div>
          <div className="font-medium break-all">{club.socials.email}</div>
        </a>
        <a href={`https://instagram.com/${club.socials.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
           className="group rounded-2xl p-6 bg-gradient-card border border-border hover:border-primary/50 hover:shadow-glow transition-all">
          <Instagram className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Instagram</div>
          <div className="font-medium">{club.socials.instagram}</div>
        </a>
        <a href={`https://linkedin.com/company/${club.socials.linkedin}`} target="_blank" rel="noreferrer"
           className="group rounded-2xl p-6 bg-gradient-card border border-border hover:border-primary/50 hover:shadow-glow transition-all">
          <Linkedin className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">LinkedIn</div>
          <div className="font-medium">{club.socials.linkedin}</div>
        </a>
        <div className="rounded-2xl p-6 bg-gradient-card border border-border">
          <MapPin className="h-6 w-6 text-primary mb-3" />
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Campus</div>
          <div className="font-medium">{club.college}</div>
        </div>
      </div>
    </Section>
  );
};
