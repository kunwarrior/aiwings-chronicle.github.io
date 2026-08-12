# Mobile leaders carousel controls — make them visible

## What's happening

The `<` `>` buttons and dots do render on mobile below the leader card, but they are very low contrast (muted grey outline on a dark background, 40px, thin icons) and sit in empty space away from the card — so they read as "not there".

## What will change

1. **Prominent arrow buttons** — filled/glass buttons with primary-tinted border, stronger icon color, larger tap target (48px), and a soft glow so they stand out on both dark and light themes.
2. **Overlay arrows on the card** — arrows also placed vertically centered on the left/right edge of the leader card (semi-transparent backdrop), the classic carousel look, so they are impossible to miss.
3. **Clearer dots + counter** — brighter inactive dots, and a small "2 / 8" counter next to them so users know there are more leaders.
4. **Swipe hint** — a one-time subtle "Swipe or tap arrows" caption under the carousel.

No changes to desktop grid, data, or admin.

## Technical notes

- Only `src/components/LeadersCarousel.tsx` is touched (plus a minor wrapper class in `src/components/sections/Members.tsx` if the overlay arrows need a `relative` container).
- Colors use existing semantic tokens (`primary`, `card`, `border`, `muted-foreground`) — no hardcoded hex.
