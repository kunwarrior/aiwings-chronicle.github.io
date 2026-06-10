# Plan: Light mode ko attractive banao (without confusion)

## Kya karna hai
1. **Revert**: Admin ke background color settings sirf **dark mode** me apply honge (pehle jaisa). Light mode pe woh custom colors apply nahi honge — confusion khatam.
   - `src/components/BrandingApplier.tsx`: wapas `isDark` check laga denge, jaisa pehle tha.
   - `src/components/admin/SiteSettingsPanel.tsx`: label wapas "Dark mode background" / "Only affects dark mode" kar denge.

2. **Light theme ko attractive banao** (dark mode jaisa rich feel):
   - `src/index.css` ke `:root` (light) tokens improved rahenge — multi-layer glowing gradient hero (blue + cyan + soft violet glows), thoda tinted background, richer card gradient aur stronger glow shadow. Yeh changes already applied hain aur achhe lag rahe hain, inhe **keep** karenge.
   - Sirf gradient ko aur subtle/clean karenge taki "day" feel bhi bana rahe (over-saturated na ho).

## Files
- `src/components/BrandingApplier.tsx` — revert to dark-only apply
- `src/components/admin/SiteSettingsPanel.tsx` — labels wapas dark-mode wale
- `src/index.css` — light theme tokens polished rahenge (minor tweak for balance)

## Out of scope
- Koi naya feature nahi
- Dark mode ko touch nahi karenge
- Admin DB / RLS / auth me kuch change nahi
