import { club } from "@/data/club";

export const Footer = () => {
  return (
    <footer className="border-t border-border py-10 mt-10">
      <div className="container-x flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center">
            <span className="font-display font-bold text-primary-foreground text-xs">AI</span>
          </div>
          <div>
            <div className="font-display font-semibold text-foreground">{club.name}</div>
            <div className="text-xs">© {new Date().getFullYear()} · {club.college}</div>
          </div>
        </div>
        <div className="font-mono text-xs">
          Built with <span className="text-primary">♥</span> by The AI Wings core team
        </div>
      </div>
    </footer>
  );
};
