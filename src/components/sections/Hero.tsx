import { useEffect, useRef } from "react";
import aiWingsLogo from "@/assets/aiwings-logo.png";
import ggctLogo from "@/assets/ggct-logo.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Cpu, Zap } from "lucide-react";
import { club } from "@/data/club";

export const Hero = () => {
  const wordsRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse parallax
  useEffect(() => {
    let raf = 0;
    const handle = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        if (wordsRef.current) wordsRef.current.style.transform = `translate3d(${x * 0.3}px, ${y * 0.3}px, 0)`;
        if (logoRef.current) logoRef.current.style.transform = `translate3d(${-x * 1.2}px, ${-y * 1.2}px, 0)`;
      });
    };
    window.addEventListener("mousemove", handle);
    return () => { window.removeEventListener("mousemove", handle); cancelAnimationFrame(raf); };
  }, []);

  // Neural network canvas — animated nodes + connecting lines
  useEffect(() => {
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
      ctx.scale(dpr, dpr);
    };
    resize();

    const count = Math.min(70, Math.floor((w * h) / 18000));
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
          if (d < 140) {
            ctx.strokeStyle = `hsl(${color} / ${(1 - d / 140) * 0.35})`;
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
  }, []);

  return (
    <section id="top" className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Layered AI background */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-br from-background via-primary/5 to-background" />
      <div className="absolute inset-0 -z-20 neural-grid opacity-40" />

      {/* Animated neural network */}
      <canvas ref={canvasRef} className="absolute inset-0 -z-10 w-full h-full opacity-70" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />

      <div className="container-x relative">
        {/* College badge with BIG logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 pl-2 pr-5 py-2 rounded-full glass backdrop-blur-xl shadow-glow">
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-glow">
              <img src={ggctLogo} alt="GGCT" className="h-full w-full object-cover" />
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-primary/30" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Official AI Club</div>
              <div className="text-sm font-semibold">{club.college}</div>
            </div>
            <span className="h-2 w-2 rounded-full bg-primary animate-neural-pulse" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div ref={wordsRef} className="transition-transform duration-300 ease-out text-center lg:text-left">
            <h1 className="font-display font-bold text-6xl md:text-7xl lg:text-[7.5rem] leading-[0.9] mb-6 animate-fade-in-up">
              <span className="block text-foreground/90">The</span>
              <span className="block text-gradient drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]">AI Wings</span>
            </h1>

            <p className="max-w-2xl mx-auto lg:mx-0 text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
              {club.tagline} Where curious minds at <span className="text-foreground font-semibold">Gyan Ganga College of Technology</span> learn, build and ship intelligent things together.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow group text-base px-7 py-6">
                <a href="#register">
                  <Zap className="mr-2 h-4 w-4" />
                  Join the Club
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass text-base px-7 py-6">
                <a href="#activities">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  Latest Updates
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
              {[
                { v: "50+", l: "Members" },
                { v: "12+", l: "Workshops" },
                { v: "06", l: "Hackathons" },
                { v: "∞", l: "Curiosity" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-primary/40 pl-4 text-left">
                  <div className="font-display font-bold text-3xl md:text-4xl text-gradient">{s.v}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Logo showcase — BIG college + AI Wings */}
          <div ref={logoRef} className="relative hidden lg:flex items-center justify-center transition-transform duration-300 ease-out animate-fade-in min-h-[520px]" style={{ animationDelay: "0.2s" }}>
            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-96 w-96 rounded-full bg-primary/25 blur-3xl animate-pulse-glow" />
            </div>

            {/* Outer rotating ring with markers */}
            <div className="absolute h-[520px] w-[520px] rounded-full border border-primary/20 animate-[spin_30s_linear_infinite]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-primary shadow-glow"
                  style={{
                    top: "50%", left: "50%",
                    transform: `rotate(${i * 45}deg) translateY(-260px)`,
                  }}
                />
              ))}
            </div>
            {/* Middle counter-rotating ring */}
            <div className="absolute h-[420px] w-[420px] rounded-full border border-accent/20 animate-[spin_20s_linear_infinite_reverse]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent shadow-glow" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent shadow-glow" />
            </div>
            {/* Inner dashed ring */}
            <div className="absolute h-[340px] w-[340px] rounded-full border-2 border-dashed border-primary/15 animate-[spin_40s_linear_infinite]" />

            {/* Big College logo at top */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="relative h-28 w-28 rounded-full overflow-hidden ring-4 ring-primary/40 shadow-glow bg-background animate-float">
                <img src={ggctLogo} alt="Gyan Ganga College of Technology" className="h-full w-full object-cover" />
              </div>
              <div className="text-center mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-primary">GGCT</div>
            </div>

            {/* AI Wings logo center */}
            <img
              src={aiWingsLogo}
              alt="The AI Wings logo"
              className="relative z-10 w-[360px] max-w-full drop-shadow-[0_0_50px_hsl(var(--primary)/0.6)] animate-float"
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

        {/* Mobile: big logos row */}
        <div className="lg:hidden mt-12 flex items-center justify-center gap-6 animate-fade-in">
          <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-primary/40 shadow-glow bg-background animate-float">
            <img src={ggctLogo} alt="GGCT" className="h-full w-full object-cover" />
          </div>
          <div className="h-px w-8 bg-gradient-to-r from-primary to-accent" />
          <img src={aiWingsLogo} alt="The AI Wings" className="h-28 w-28 object-contain drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)] animate-float" style={{ animationDelay: "1s" }} />
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
