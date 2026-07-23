## Goal
Guarantee that Navbar ka **theme mode (dark/light)** aur **accent color** picker sirf us user ke apne device pe apply ho — kabhi bhi doosre users ke website pe reflect na ho. Sirf admin panel se ki gayi Site Settings changes hi sabko dikhen.

## Current state (verified)
`src/lib/theme.tsx` already:
- Theme + accent ko sirf `localStorage` (`aiw-theme`, `aiw-accent`) me save karta hai.
- Sirf `document.documentElement` par CSS variables set karta hai (client-side).
- Koi Supabase / DB write nahi karta.

Matlab technically ye already per-device hai. User ko 100% surety chahiye, isliye chhota hardening pass karenge + code me comment daal denge taaki future me galti se global na ho.

## Changes

**1. `src/lib/theme.tsx`** — add clarifying header comment: "Per-device only, never synced to DB". Wrap `localStorage` access in try/catch (private mode safety) so it never falls back to a shared default silently.

**2. `src/components/Navbar.tsx`** — no logic change; add a tiny tooltip / `title` attribute on the palette + dark-mode buttons: "Only changes your device".

**3. Verify no other code path writes theme/accent globally:**
- Grep for `aiw-theme`, `aiw-accent`, `setAccent`, and any `site_settings` write that touches theme/accent. If found (not expected), remove.
- Confirm `BrandingApplier` only reads admin's `branding` row and only sets `--background` / `--gradient-hero` in dark mode — it does NOT touch `--primary` / accent tokens. (Already true.)

**4. Manual verification steps** (I'll run):
- Open two browser profiles → change accent in profile A → refresh profile B → confirm profile B unchanged.
- Toggle dark/light in profile A → profile B unchanged.

## Out of scope
- Admin Site Settings panel behaviour (background color etc.) stays global — that's intentional.
- No DB migration, no new tables.

## Files touched
- `src/lib/theme.tsx` (comment + try/catch)
- `src/components/Navbar.tsx` (button `title` attributes)
