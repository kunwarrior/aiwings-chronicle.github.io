import { useEffect, useRef } from "react";
import aiWingsLogo from "@/assets/aiwings-logo.png";
import ggctLogo from "@/assets/ggct-logo.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { club } from "@/data/club";

export const Hero = () => {
  const wordsRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const handle = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 16;
        const y = (e.clientY / window.innerHeight - 0.5) * 16;
        if (wordsRef.current) wordsRef.current.style.transform = `translate3d(${x * 0.4}px, ${y * 0.4}px, 0)`;
        if (logoRef.current) logoRef.current.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
      });
    };
    window.addEventListener("mousemove", handle);
    return () => { window.removeEventListener("mousemove", handle); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="top" className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Layered AI background */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-background via-primary/5 to-background" />
      <div className="absolute inset-0 -z-10 neural-grid opacity-50" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />

      {/* Floating circuit dots */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/60 animate-neural-pulse"
            style={{
              top: `${(i * 53) % 100}%`,
              left: `${(i * 71) % 100}%`,
              animationDelay: `${(i % 6) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="container-x relative">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div ref={wordsRef} className="transition-transform duration-300 ease-out">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass backdrop-blur-xl text-xs font-mono uppercase tracking-wider mb-6 animate-fade-in">
              <img src={ggctLogo} alt="GGCT" className="h-4 w-4 rounded-full object-cover" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-neural-pulse" />
              {club.college} · est. {club.established}
            </div>

            <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6 animate-fade-in-up">
              <span className="block">The</span>
              <span className="block text-gradient">AI Wings</span>
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
              {club.tagline} The official AI club of <span className="text-foreground font-medium">Gyan Ganga College of Technology</span>, where curious minds learn, build and ship intelligent things together.
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow group">
                <a href="#register">
                  Join the Club
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass">
                <a href="#activities">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  Latest Activity
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl animate-fade-in-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
              {[
                { v: "50+", l: "Members" },
                { v: "12+", l: "Workshops" },
                { v: "06", l: "Hackathons" },
                { v: "∞", l: "Curiosity" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-primary/40 pl-4">
                  <div className="font-display font-bold text-3xl md:text-4xl text-gradient">{s.v}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Logo showcase */}
          <div ref={logoRef} className="relative hidden lg:flex items-center justify-center transition-transform duration-300 ease-out animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
            </div>
            {/* Rotating ring */}
            <div className="absolute h-[420px] w-[420px] rounded-full border border-primary/20 animate-[spin_30s_linear_infinite]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary shadow-glow" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent shadow-glow" />
            </div>
            <div className="absolute h-[340px] w-[340px] rounded-full border border-primary/15 animate-[spin_20s_linear_infinite_reverse]" />
            <img
              src={aiWingsLogo}
              alt="The AI Wings logo"
              className="relative z-10 w-[420px] max-w-full drop-shadow-[0_0_40px_hsl(var(--primary)/0.5)] animate-float"
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="h-10 w-6 rounded-full border-2 border-primary/40 flex items-start justify-center p-1.5">
          <div className="h-2 w-1 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </section>
  );
};
