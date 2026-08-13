import { useEffect, useRef } from "react";
import aiWingsLogo from "@/assets/aiwings-logo.png";
import ggctLogo from "@/assets/ggct-logo.png";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Cpu, Zap } from "lucide-react";
import { club } from "@/data/club";
import { useHeroSettings, useBrandingSettings } from "@/hooks/useSiteSettings";

export const Hero = () => {
  const { settings } = useHeroSettings();
  const { settings: branding } = useBrandingSettings();
  const effectsOn = settings.effects_enabled;
  const colorEffectsOn = branding.color_effects_enabled;
  const bgImage = settings.background_image_url;
  const heroLogo = branding.hero_logo_url || aiWingsLogo;

  const wordsRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse parallax — paused during scroll for smoothness
  useEffect(() => {
    if (!effectsOn) return;
    let raf = 0;
    let scrolling = false;
    let scrollTimer: number | undefined;
    const onScroll = () => {
      scrolling = true;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => { scrolling = false; }, 180);
    };
    const handle = (e: MouseEvent) => {
      if (scrolling) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        if (wordsRef.current) wordsRef.current.style.transform = `translate3d(${x * 0.3}px, ${y * 0.3}px, 0)`;
        if (logoRef.current) logoRef.current.style.transform = `translate3d(${-x * 1.2}px, ${-y * 1.2}px, 0)`;
      });
    };
    window.addEventListener("mousemove", handle, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handle);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollTimer);
      cancelAnimationFrame(raf);
    };
  }, [effectsOn]);

  // Neural network canvas — animated nodes + connecting lines
  useEffect(() => {
    if (!effectsOn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();

    const isSmall = w < 768;
    const maxNodes = isSmall ? 34 : 70;
    const linkDist = isSmall ? 100 : 140;
    const count = Math.min(maxNodes, Math.floor((w * h) / (isSmall ? 14000 : 18000)));
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    const getColor = () => {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue("--primary").trim() || "217 91% 60%";
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const color = getColor();
      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            ctx.strokeStyle = `hsl(${color} / ${(1 - d / linkDist) * 0.35})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        ctx.fillStyle = `hsl(${color} / 0.9)`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { resize(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [effectsOn]);

  return (
    <section id="top" className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Custom background image (admin uploaded) */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 -z-30 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div className="absolute inset-0 -z-25 bg-background/70 backdrop-blur-[2px]" />
        </>
      )}

      {/* Layered AI background — only when no custom image */}
      {!bgImage && (
        <>
          <div className="absolute inset-0 -z-30 bg-gradient-to-br from-background via-primary/5 to-background" />
          {effectsOn && <div className="absolute inset-0 -z-20 neural-grid opacity-40" />}
        </>
      )}

      {/* Animated neural network */}
      {effectsOn && (
        <canvas ref={canvasRef} className="absolute inset-0 -z-10 w-full h-full opacity-70" />
      )}

      {/* Animated colored orbs (separate toggle: color effects) */}
      {colorEffectsOn && (
        <>
          {effectsOn && <div className="absolute top-1/4 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl animate-float" />}
          {effectsOn && <div className="absolute bottom-1/4 -right-32 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-3xl animate-float" style={{ animationDelay: "2s" }} />}
          {effectsOn && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />}
        </>
      )}

      <div className="container-x relative">
        {/* College badge — wider, no Official AI Club */}
        <div className="flex justify-center mb-6 md:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 md:gap-5 pl-3 pr-4 py-2.5 md:pl-5 md:pr-8 md:py-4 rounded-full glass backdrop-blur-xl shadow-glow max-w-full">
            <div className="relative h-11 w-11 md:h-16 md:w-16 shrink-0">
              <img src={ggctLogo} alt="GGCT" className="h-full w-full object-contain drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
            </div>
            <div className="text-left leading-tight min-w-0">
              <div className="text-[11px] sm:text-sm md:text-lg font-display font-semibold text-muted-foreground">{club.college}</div>
            </div>
            <span className="h-2 w-2 md:h-2.5 md:w-2.5 shrink-0 rounded-full bg-primary animate-neural-pulse" />
          </div>
        </div>

        {/* Mobile logo showcase — same vibe as desktop, scaled down */}
        <div className="lg:hidden relative flex items-center justify-center h-[300px] sm:h-[360px] mb-6 animate-fade-in">
          {colorEffectsOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[15rem] sm:h-[18rem] w-[15rem] sm:w-[18rem] rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
            </div>
          )}

          {effectsOn && (
            <>
              <div className="absolute h-[290px] w-[290px] sm:h-[350px] sm:w-[350px] rounded-full border border-primary/20 animate-[spin_30s_linear_infinite]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-primary shadow-glow"
                    style={{ top: "50%", left: "50%", transform: `rotate(${i * 45}deg) translateY(-145px)` }}
                  />
                ))}
              </div>
              <div className="absolute h-[230px] w-[230px] sm:h-[280px] sm:w-[280px] rounded-full border border-accent/20 animate-[spin_20s_linear_infinite_reverse]">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-accent shadow-glow" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-accent shadow-glow" />
              </div>
              <div className="absolute h-[180px] w-[180px] sm:h-[220px] sm:w-[220px] rounded-full border-2 border-dashed border-primary/15 animate-[spin_40s_linear_infinite]" />
            </>
          )}

          <img
            src={heroLogo}
            alt="The AI Wings logo"
            className="relative z-10 w-[190px] sm:w-[240px] max-w-full drop-shadow-[0_0_45px_hsl(var(--primary)/0.7)] animate-float"
            style={{ animationDelay: "1s" }}
          />

          <div className="absolute top-6 left-0 px-2.5 py-1 rounded-full glass backdrop-blur-xl text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 animate-float" style={{ animationDelay: "0.5s" }}>
            <Cpu className="h-3 w-3 text-primary" /> Machine Learning
          </div>
          <div className="absolute bottom-6 right-0 px-2.5 py-1 rounded-full glass backdrop-blur-xl text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 animate-float" style={{ animationDelay: "1.5s" }}>
            <Sparkles className="h-3 w-3 text-accent" /> Generative AI
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div ref={wordsRef} className="transition-transform duration-300 ease-out text-center lg:text-left">
            <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] leading-[0.9] mb-5 md:mb-6 animate-fade-in-up">
              <span className="block text-foreground/90">The</span>
              <span className="block text-gradient drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]">AI Wings</span>
            </h1>

            <p className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg md:text-xl text-muted-foreground mb-7 md:mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
              {club.tagline} Where curious minds at <span className="text-foreground font-semibold">Gyan Ganga College of Technology</span> learn, build and ship intelligent things together.
            </p>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow group w-full sm:w-auto text-sm sm:text-base px-4 sm:px-7 py-5 sm:py-6">
                <a href="#events">
                  <Zap className="mr-2 h-4 w-4" />
                  See Events
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass w-full sm:w-auto text-sm sm:text-base px-4 sm:px-7 py-5 sm:py-6">
                <a href="#activities">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  Latest Updates
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
              {[
                { v: "50+", l: "Members" },
                { v: "12+", l: "Workshops" },
                { v: "06", l: "Hackathons" },
                { v: "∞", l: "Curiosity" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-primary/40 pl-3 md:pl-4 text-left">
                  <div className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-gradient">{s.v}</div>
                  <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-mono mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Wings logo showcase — rings only, no GGCT badge */}
          <div ref={logoRef} className="relative hidden lg:flex items-center justify-center transition-transform duration-300 ease-out animate-fade-in min-h-[560px]" style={{ animationDelay: "0.2s" }}>
          {/* Glow — gated by color effects toggle */}
            {colorEffectsOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
              </div>
            )}

            {effectsOn && (
              <>
                {/* Outer rotating ring with markers */}
                <div className="absolute h-[540px] w-[540px] rounded-full border border-primary/20 animate-[spin_30s_linear_infinite]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-2 w-2 rounded-full bg-primary shadow-glow"
                      style={{
                        top: "50%", left: "50%",
                        transform: `rotate(${i * 45}deg) translateY(-270px)`,
                      }}
                    />
                  ))}
                </div>
                {/* Middle counter-rotating ring */}
                <div className="absolute h-[440px] w-[440px] rounded-full border border-accent/20 animate-[spin_20s_linear_infinite_reverse]">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent shadow-glow" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent shadow-glow" />
                </div>
                {/* Inner dashed ring */}
                <div className="absolute h-[360px] w-[360px] rounded-full border-2 border-dashed border-primary/15 animate-[spin_40s_linear_infinite]" />
              </>
            )}

            {/* AI Wings logo center — BIGGER */}
            <img
              src={heroLogo}
              alt="The AI Wings logo"
              className="relative z-10 w-[460px] max-w-full drop-shadow-[0_0_60px_hsl(var(--primary)/0.7)] animate-float"
              style={{ animationDelay: "1s" }}
            />

            {/* Floating chips around */}
            <div className="absolute top-1/4 -left-4 px-3 py-1.5 rounded-full glass backdrop-blur-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 animate-float" style={{ animationDelay: "0.5s" }}>
              <Cpu className="h-3 w-3 text-primary" /> Machine Learning
            </div>
            <div className="absolute bottom-1/4 -right-4 px-3 py-1.5 rounded-full glass backdrop-blur-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 animate-float" style={{ animationDelay: "1.5s" }}>
              <Sparkles className="h-3 w-3 text-accent" /> Generative AI
            </div>
          </div>
        </div>

        {/* Mobile: AI Wings big logo only */}
        <div className="lg:hidden mt-12 flex items-center justify-center animate-fade-in">
          <img src={heroLogo} alt="The AI Wings" className="h-44 w-44 object-contain drop-shadow-[0_0_40px_hsl(var(--primary)/0.6)] animate-float" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      {/* Marquee strip at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-y border-border/50 bg-background/40 backdrop-blur-sm overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-3">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-8 px-4 text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
              {["Machine Learning", "Deep Learning", "Computer Vision", "NLP & LLMs", "MLOps", "Hackathons", "Research", "Workshops", "Open Source", "AI Ethics"].map((t) => (
                <span key={`${k}-${t}`} className="flex items-center gap-8">
                  <span className="text-primary">◆</span> {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
