# Mobile Hero — same vibe as desktop

Right now on mobile the hero loses its impact: the big logo showcase (glow, rotating rings, floating "Machine Learning" / "Generative AI" chips) is desktop-only, and the mobile fallback is just a small 176px logo dropped below the text. Stats and buttons also stack flat, so the section feels plain compared to desktop.

## What changes

1. **Real logo showcase on mobile**
   - Replace the plain small logo with the same layered showcase used on desktop, scaled down: centered logo (~240-280px), glow behind it (only when color effects are on), and the rotating rings scaled to fit the phone width (outer/middle/inner) — all gated behind the existing effects toggle.
   - Keep the floating chips, positioned closer to the logo so they don't overflow.

2. **Order and rhythm**
   - On mobile show: college badge -> logo showcase -> headline -> tagline -> buttons -> stats. Logo first gives the section its visual anchor immediately.
   - Tighten vertical spacing so the hero fits roughly one screen without heavy scrolling.

3. **Headline and text scale**
   - Slightly reduce the mobile headline size so "AI Wings" fits on one line, keep the gradient and glow.
   - Tagline width capped and centered.

4. **Buttons and stats**
   - Buttons full-width side-by-side pair on small screens instead of wrapping oddly.
   - Stats as a 2x2 grid with the left accent bar kept, smaller type.

5. **College badge**
   - Compact version on mobile: smaller logo, text wraps to two lines instead of overflowing the pill.

6. **Performance guard**
   - Neural-network canvas keeps running on mobile but with a reduced node count and connection distance so it stays smooth on phones; still fully off when effects are disabled.

## Technical notes

- All work is inside `src/components/sections/Hero.tsx` (plus a small utility class in `src/index.css` if needed for the mobile ring sizing).
- Use existing tokens/animations (`shadow-glow`, `text-gradient`, `animate-float`, `animate-fade-in-up`) — no new colors.
- Reuse the existing `effects_enabled` and `color_effects_enabled` settings; behavior when toggled off stays the same.
- Node count in the canvas becomes viewport-aware instead of the fixed cap of 70.
- Desktop layout (lg and up) stays visually unchanged.
