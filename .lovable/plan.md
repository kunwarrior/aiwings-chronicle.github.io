# Smooth karna + magnetic cursor add karna

## Problems found (root cause)

1. **Hero canvas DPR bug** — `src/components/sections/Hero.tsx` me har resize pe `ctx.scale(dpr, dpr)` dobara call ho raha hai bina transform reset kiye. Iska matlab har resize pe canvas content compound ho ke bada hota jaata hai → window resize / scrollbar dikhne pe sudden "jhatka" lagta hai. Yahi viewport change session replay me bhi dikha (`1020x672` resize).
2. **Admin login flash** — `src/pages/Admin.tsx` me, agar session me password saved hai toh pehle login form render hota hai, fir silent verify hone ke baad admin panel aata hai. Beech me "ek step waapis" jaisa flash dikhta hai. Loading state nahi hai.
3. **Hero parallax + scroll** — mousemove pe `transform: translate3d(...)` set hota hai dono hero blocks pe. Scroll ke time bhi mousemove fire hote rehte hain → har frame DOM mutations (replay me yahi dikh raha hai). Yeh smoothness kharab karta hai.
4. **`background-attachment: fixed`** + big blurred orbs scroll ke time heavy repaint karte hain — mobile/medium GPU pe jhatka feel hota hai.

## Fixes

### 1. Glitch fixes
- **Hero.tsx canvas**: resize ke andar `ctx.setTransform(1,0,0,1,0,0)` call kar ke phir `ctx.scale(dpr,dpr)` — compound scale band.
- **Hero.tsx parallax**: scroll ke time parallax pause (passive scroll listener, 200ms idle ke baad resume). Idle ke time hi mouse parallax apply ho.
- **Admin.tsx**: ek `verifying` state add — agar password saved hai toh login form / admin panel kuch bhi render nahi karna, sirf ek minimal centered spinner. Verify hone ke baad sahi screen.
- **index.css**: `body` se `background-attachment: fixed` hatana (ya `@media (prefers-reduced-motion)` me) — scroll-time repaint kam hoga.

### 2. Magnetic cursor (naya)
Naya component: **`src/components/MagneticCursor.tsx`**
- Sirf desktop pe enable: `window.matchMedia('(pointer: fine)').matches` check.
- DOM me 2 elements: ek outer **ring** (32px) jo smoothly cursor follow kare (lerp animation `requestAnimationFrame`), ek small **dot** (6px) jo exactly cursor pe rahe.
- Hover detection: `mouseover`/`mouseout` listeners on `document` — jab target `a, button, [role="button"], input, textarea, [data-cursor]` ho:
  - Ring scale `1.8x` ho jaye, color `accent`, mix-blend-mode `difference`.
  - Magnetic pull: ring target ke center ki taraf ~30% slide ho (target ke `getBoundingClientRect()` se).
- Style: `position: fixed; pointer-events: none; z-index: 9999;` — design tokens use (`border-primary`, `bg-primary`).
- Optional: native cursor hide karna `body { cursor: none }` sirf jab `(pointer: fine)` — touch users normal cursor dekhe.
- App.tsx me `<MagneticCursor />` mount karna (BrowserRouter ke andar ya bahar fine).

### 3. Errors sweep
- Build/lint quickly check karunga; agar koi console warnings dikhe (key warnings, missing deps), spot-fix karunga **sirf agar same files chhuni padi**. Scope creep nahi.

## Files to change

- `src/components/sections/Hero.tsx` — canvas DPR fix + parallax scroll pause
- `src/pages/Admin.tsx` — `verifying` loading state
- `src/index.css` — `background-attachment` adjust
- `src/components/MagneticCursor.tsx` *(new)*
- `src/App.tsx` — mount MagneticCursor

## Out of scope
- Hero ke 3 rotating rings hatana nahi — sirf canvas/parallax tweak.
- Koi DB / RLS / edge function change nahi.
- Mobile pe cursor disable (aapne confirm kiya: sirf desktop).
