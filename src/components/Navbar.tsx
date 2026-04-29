import { useEffect, useState } from "react";
import { Moon, Sun, Palette, Menu, X } from "lucide-react";
import { useTheme, ACCENT_LIST } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import aiWingsLogo from "@/assets/aiwings-logo.png";
import ggctLogo from "@/assets/ggct-logo.jpg";

const NAV = [
  { id: "about", label: "About" },
  { id: "members", label: "Team" },
  { id: "activities", label: "Activities" },
  { id: "events", label: "Events" },
  { id: "achievements", label: "Achievements" },
  { id: "gallery", label: "Gallery" },
  { id: "contact", label: "Contact" },
];

const ACCENT_COLORS: Record<string, string> = {
  blue: "hsl(217 91% 60%)",
  cyan: "hsl(189 94% 55%)",
  violet: "hsl(262 83% 65%)",
  emerald: "hsl(152 76% 50%)",
};

export const Navbar = () => {
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [palOpen, setPalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="container-x">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 md:px-6 py-3 transition-all duration-500",
            scrolled ? "glass backdrop-blur-xl shadow-card" : "bg-transparent"
          )}
        >
          <a href="#top" className="flex items-center gap-3 group">
            <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-glow group-hover:ring-primary transition-all">
              <img src={ggctLogo} alt="GGCT" className="h-full w-full object-cover" />
            </div>
            <div className="relative h-11 w-11 rounded-xl bg-background/40 backdrop-blur ring-1 ring-primary/30 shadow-glow flex items-center justify-center overflow-hidden group-hover:ring-primary/60 transition-all">
              <img src={aiWingsLogo} alt="The AI Wings" className="h-10 w-10 object-contain" />
              <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent,hsl(var(--primary)/.15),transparent)] bg-[length:200%_100%]" />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="font-display font-bold text-base">The AI Wings</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Gyan Ganga · GGCT</div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {n.label}
                <span className="absolute bottom-1 left-3 right-3 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setPalOpen((v) => !v)} aria-label="Theme color">
                <Palette className="h-4 w-4" />
              </Button>
              {palOpen && (
                <div className="absolute right-0 mt-2 p-2 rounded-xl glass backdrop-blur-xl shadow-card flex gap-2 animate-scale-in">
                  {ACCENT_LIST.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setAccent(a); setPalOpen(false); }}
                      className={cn(
                        "h-7 w-7 rounded-full transition-transform hover:scale-110",
                        accent === a && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                      )}
                      style={{ backgroundColor: ACCENT_COLORS[a] }}
                      aria-label={a}
                    />
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              <a href="#register">Join Us</a>
            </Button>
            <Link to="/admin" className="hidden md:block text-xs text-muted-foreground hover:text-primary transition-colors font-mono">
              admin
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden mt-2 p-4 rounded-2xl glass backdrop-blur-xl shadow-card animate-scale-in">
            <div className="flex flex-col gap-1">
              {NAV.map((n) => (
                <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors">
                  {n.label}
                </a>
              ))}
              <Link to="/admin" className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary">Admin Panel</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
