import { useEffect, useRef } from "react";

/**
 * Desktop-only magnetic ring cursor.
 * - Outer ring lerps toward mouse / magnetic target every frame.
 * - Inner dot follows mouse exactly.
 * - Hover over interactive elements: ring grows, glows, pulses, and snaps toward target center.
 * - Recomputes targets every frame so theme/layout changes never desync the ring.
 */
export const MagneticCursor = () => {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.body.classList.add("magnetic-cursor-on");

    const state = {
      mouseX: window.innerWidth / 2,
      mouseY: window.innerHeight / 2,
      ringX: window.innerWidth / 2,
      ringY: window.innerHeight / 2,
      hoverTarget: null as Element | null,
      visible: false,
      pressed: false,
    };
    let raf = 0;

    const interactiveSelector =
      'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor]';

    const setVisible = (v: boolean) => {
      if (state.visible === v) return;
      state.visible = v;
      ringRef.current?.classList.toggle("is-visible", v);
      dotRef.current?.classList.toggle("is-visible", v);
    };

    const onMove = (e: MouseEvent) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
      setVisible(true);
      // Re-derive hover target from actual point — survives theme/layout swaps.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const t = el?.closest?.(interactiveSelector) ?? null;
      if (t !== state.hoverTarget) {
        state.hoverTarget = t;
        ringRef.current?.classList.toggle("is-hover", !!t);
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onDown = () => {
      state.pressed = true;
      ringRef.current?.classList.add("is-press");
    };
    const onUp = () => {
      state.pressed = false;
      ringRef.current?.classList.remove("is-press");
    };

    const tick = () => {
      // Recompute magnetic target each frame using current rect (handles reflow/theme change)
      let tx = state.mouseX;
      let ty = state.mouseY;
      if (state.hoverTarget && document.contains(state.hoverTarget)) {
        const r = (state.hoverTarget as HTMLElement).getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        tx = state.mouseX + (cx - state.mouseX) * 0.25;
        ty = state.mouseY + (cy - state.mouseY) * 0.25;
      } else if (state.hoverTarget) {
        // target was removed from DOM (e.g. theme repaint)
        state.hoverTarget = null;
        ringRef.current?.classList.remove("is-hover");
      }

      state.ringX += (tx - state.ringX) * 0.22;
      state.ringY += (ty - state.ringY) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${state.mouseX}px, ${state.mouseY}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${state.ringX}px, ${state.ringY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.body.classList.remove("magnetic-cursor-on");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="magnetic-ring pointer-events-none fixed top-0 left-0 z-[9999]"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="magnetic-dot pointer-events-none fixed top-0 left-0 z-[9999]"
      />
    </>
  );
};
