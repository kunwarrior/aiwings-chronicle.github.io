# Mobile carousel for Team Leaders

## Goal
Mobile view par "Core Team" (leaders) section bahut lamba ho jata hai. Isko ek-card-at-a-time slider bana denge — auto-slide + left/right buttons.

## Kya banega

- **Mobile (< 768px)**: leaders section me ek waqt me sirf ek leader card dikhega, poori width par.
- **Auto-play**: har ~4 second me agla leader slide hoga (loop). User ke touch/swipe ya button click par autoplay 8 second ke liye ruk jayega, phir dobara chalu.
- **Prev / Next buttons**: card ke neeche `<` aur `>` circular buttons, beech me dots indicator (kaunsa leader chal raha hai).
- **Swipe**: ungli se left/right swipe karke bhi change kar sakte ho.
- **Desktop**: bilkul waisa hi rahega jaisa abhi hai (3-column grid) — koi change nahi.

Members grid aur HOD/Faculty sections abhi jaise hain waise hi rahenge (members already 2-column compact hain). Agar chaho to members ko bhi baad me isi tarah kar sakte hain.

## Technical details

- `src/components/sections/Members.tsx` me leaders block ko do render paths me split karenge: desktop grid (`hidden md:grid`) aur mobile carousel (`md:hidden`).
- Naya component `src/components/LeadersCarousel.tsx`:
  - track div par `translateX(-index * 100%)` transition (CSS transform, smooth 500ms).
  - `useEffect` interval autoplay, `document.hidden` hone par pause, unmount par clear.
  - touchstart/touchend se swipe detect (threshold ~40px).
  - buttons par `aria-label` ("Previous leader" / "Next leader"), dots par `aria-current`.
  - Leader card markup wahi rahega (same tokens/styling, social links, glow) — sirf wrapper alag.
- Ek hi leader hone par arrows/dots hide, autoplay off.
