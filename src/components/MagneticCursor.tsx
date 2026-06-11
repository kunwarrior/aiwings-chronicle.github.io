import { useEffect, useRef } from "react";

/**
 * Desktop-only magnetic ring cursor.
 * - Outer ring lerps toward mouse position.
 * - Small dot follows exactly.
 * - On hover over interactive elements: ring grows + magnetically snaps toward target center.
 */
export const MagneticCursor = () => {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.body.classList.add("magnetic-cursor-on");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let targetX = mouseX;
    let targetY = mouseY;
    let hoverTarget: Element | null = null;
    let raf = 0;

    const interactiveSelector = 'a, button, [role="button"], input, textarea, select, [data-cursor]';

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
      if (hoverTarget) {
        const rect = (hoverTarget as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // magnetic pull: 30% toward center
        targetX = mouseX + (cx - mouseX) * 0.3;
        targetY = mouseY + (cy - mouseY) * 0.3;
      } else {
        targetX = mouseX;
        targetY = mouseY;
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = (e.target as Element)?.closest?.(interactiveSelector);
      if (t) {
        hoverTarget = t;
        ringRef.current?.classList.add("is-hover");
      }
    };
    const onOut = (e: MouseEvent) => {
      const t = (e.target as Element)?.closest?.(interactiveSelector);
      if (t && t === hoverTarget) {
        hoverTarget = null;
        ringRef.current?.classList.remove("is-hover");
      }
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
      document.body.classList.remove("magnetic-cursor-on");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="magnetic-ring pointer-events-none fixed top-0 left-0 z-[9999] h-8 w-8 rounded-full border-2 border-primary/80 shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-[width,height,background-color,border-color,opacity] duration-200 will-change-transform"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="magnetic-dot pointer-events-none fixed top-0 left-0 z-[9999] h-1.5 w-1.5 rounded-full bg-primary will-change-transform"
      />
    </>
  );
};
