import { useEffect, useRef } from "react";
import heroImg from "@/assets/hero-neural.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { club } from "@/data/club";

export const Hero = () => {
  const wordsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const handle = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!wordsRef.current) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        wordsRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    window.addEventListener("mousemove", handle);
    return () => { window.removeEventListener("mousemove", handle); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="top" className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img src={heroImg} alt="" className="w-full h-full object-cover opacity-40 dark:opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
      </div>
      <div className="absolute inset-0 -z-10 neural-grid opacity-40" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="container-x relative">
        <div ref={wordsRef} className="transition-transform duration-300 ease-out">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass backdrop-blur-xl text-xs font-mono uppercase tracking-wider mb-6 animate-fade-in">
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
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl animate-fade-in-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
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
