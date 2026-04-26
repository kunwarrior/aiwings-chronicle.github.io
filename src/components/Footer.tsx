import { club } from "@/data/club";
import aiWingsLogo from "@/assets/aiwings-logo.png";
import ggctLogo from "@/assets/ggct-logo.jpg";

export const Footer = () => {
  return (
    <footer className="border-t border-border py-10 mt-10">
      <div className="container-x flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-background/40 ring-1 ring-primary/30 shadow-glow flex items-center justify-center overflow-hidden">
            <img src={aiWingsLogo} alt="The AI Wings" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <div className="font-display font-semibold text-foreground">{club.name}</div>
            <div className="text-xs">© {new Date().getFullYear()} · {club.college}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <img src={ggctLogo} alt="GGCT" className="h-10 w-10 rounded-full object-cover ring-1 ring-border" />
          <div className="font-mono text-xs">
            Built with <span className="text-primary">♥</span> by The AI Wings core team
          </div>
        </div>
      </div>
    </footer>
  );
};
