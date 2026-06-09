## Goal
Event registration ke Google sign-in ko hatake **Email + Password** authentication lagana, taaki Vercel (ya kahin bhi) deploy karne pe bhi smoothly chale. Spam control banaye rakhne ke liye email verification mandatory rahega.

## Kya badlega

### 1. Auth provider switch (backend)
- `configure_social_auth` se **Google disable** karna, aur **Email enable** rakhna.
- `configure_auth`: `auto_confirm_email: false` (verification mandatory), `disable_signup: false`, `external_anonymous_users_enabled: false`, `password_hibp_enabled: true` (leaked passwords block).
- DB / RLS / `user_id` column / unique index — sab waise ke waise rahenge (already secure hain).

### 2. `EventDetail.tsx` me auth gate change
Google button ki jagah ek chhota inline **Sign in / Sign up** card:
- Toggle: "Sign in" ↔ "Create account"
- Fields: Email, Password (sign-up me Full name bhi)
- Sign-up: `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href, data: { full_name } } })` → user ko bolenge "Inbox check karo, verify link click karke wapas aao."
- Sign-in: `supabase.auth.signInWithPassword(...)`
- "Forgot password?" link → `/reset-password` page pe le jaayega.
- Baaki flow same: signed-in user ko form prefill, duplicate check, submit.

### 3. Naya `/reset-password` page (required by Lovable rules)
- Forgot password form (email input) → `resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- Recovery link pe aane wale user ko naya password set karne ka form → `supabase.auth.updateUser({ password })`
- Public route, App.tsx routes me add.

### 4. Lovable broker code cleanup
- `src/integrations/lovable/index.ts` aur `@lovable.dev/cloud-auth-js` package ab use nahi honge (file auto-gen hai, chhod denge — koi harm nahi, par import remove karenge `EventDetail.tsx` se).

### Files touched
- `supabase/migrations/<new>.sql` (sirf agar koi auth-side flag SQL chahiye — actual auth settings tools se hote hain, migration likely nahi)
- `src/pages/EventDetail.tsx` — auth UI swap
- `src/pages/ResetPassword.tsx` — naya
- `src/App.tsx` — `/reset-password` route add

### Out of scope
- Custom branded auth emails (default Lovable verification email chalega, jo sufficient hai). Agar baad me apne domain se branded email chahiye toh alag se setup karenge.
- Admin login flow ko chhua nahi jaa raha.

### Note
Vercel pe deploy karne pe Supabase verification email ka link `window.location.origin` (yaani Vercel URL) pe wapas aayega — woh sahi se chalega. Lovable broker ka dependency hat jaayega.
