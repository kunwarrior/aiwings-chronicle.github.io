import { club } from "@/data/club";
import aiWingsLogo from "@/assets/aiwings-logo.png";
import ggctLogo from "@/assets/ggct-logo.jpg";

export const Footer = () => {
  return (
    <footer className="border-t border-border py-10 mt-10">
      <div className="container-x flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-glow">
            <img src={ggctLogo} alt="GGCT" className="h-full w-full object-cover" />
          </div>
          <div className="h-14 w-14 rounded-xl bg-background/40 ring-1 ring-primary/30 shadow-glow flex items-center justify-center overflow-hidden">
            <img src={aiWingsLogo} alt="The AI Wings" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <div className="font-display font-semibold text-foreground text-base">{club.name}</div>
            <div className="text-xs">© {new Date().getFullYear()} · {club.college}</div>
          </div>
        </div>
        <div className="font-mono text-xs text-center md:text-right">
          Built with <span className="text-primary">♥</span> by The AI Wings core team<br />
          <span className="text-muted-foreground/70">Gyan Ganga College of Technology</span>
        </div>
      </div>
    </footer>
  );
};
