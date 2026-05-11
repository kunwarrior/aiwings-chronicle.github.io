## Goal

1. Event registration sirf Google se signed-in users hi kar paayein → fake/spam rok-thaam.
2. Admin → Registrations panel me har row click karne par ek modal khule jisme us person ki **saari** details (built-in fields + custom question answers + payment info + screenshot) ek jagah dikhein.

---

## Part 1 — Google sign-in compulsory on event registration

**Setup**
- `supabase--configure_social_auth` se Google provider enable (managed, koi key nahi chahiye).
- Email/password auth enabled rahega (existing admin login flow ke liye chhua nahi jaayega), bas event-register par sirf Google hi UI me dikhega.

**EventDetail.tsx changes**
- Page mount par `supabase.auth.getSession()` + `onAuthStateChange` listener.
- Agar user signed-in nahi hai → registration form ki jagah ek card dikhe:
  - Heading: "Sign in to register"
  - Sub: "Spam rokne ke liye Google se sign-in zaruri hai"
  - Button: **Continue with Google** → `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.href })`
- Signed-in hone ke baad form auto-prefill:
  - `full_name` ← Google `user_metadata.full_name`
  - `email` ← `user.email` (read-only field)
- Top-right me chhota "Signed in as <email> · Sign out" pill.
- Submit payload me naya field `user_id: user.id` jaayega.

**Anti-spam DB rule (migration)**
- `registrations` table me column add: `user_id uuid` (nullable for old rows).
- Naya RLS INSERT policy: `auth.uid() IS NOT NULL AND auth.uid() = user_id AND email = auth.jwt()->>'email'` → sirf logged-in user apni hi id/email se insert kar sake.
- Purani "Public can register" policy hata di jaayegi.
- Unique index `(event_id, user_id)` → ek user ek event me ek hi baar register kar paaye (duplicate spam block).
- Agar user already registered hai us event me → form ki jagah "You're already registered" card.

---

## Part 2 — Click-to-view full registration details (Admin)

**RegistrationsPanel.tsx changes**
- Har registration card ko clickable banao (cursor-pointer + hover ring).
- Click par `Dialog` (shadcn) khule — `RegistrationDetailModal`:
  - **Personal**: Full name, Email, Phone, Branch, Year, Submitted at
  - **Event**: Event title, Fee, Payment status badge
  - **Account**: Signed-in user id + Google email (verified ✓ chip)
  - **Custom answers**: Event ke `custom_questions` ke labels ke saath user ke `custom_responses` map karke list (label → answer). Question label fetch karne ke liye event row ka `custom_questions` use hoga (already events list me aata hai, bas full object store karna hoga, not just `{id,title}`).
  - **Payment**: Transaction ref (copy button), Payment proof image (full-size view + open in new tab)
  - **Admin**: Status change buttons + Delete button + Admin notes textarea (save)
- Status/Delete buttons row se hata ke modal ke andar le jayenge → list clean dikhe; row par sirf naam + status badge + chevron icon.

**Small fix**: `events` list ko `id, title, custom_questions` select karna taaki labels mil sakein.

---

## Files to touch

- `supabase/migrations/<new>.sql` — `user_id` column, drop old INSERT policy, naya RLS policy, unique index.
- `src/pages/EventDetail.tsx` — auth gate, prefill, duplicate check, payload me `user_id`.
- `src/components/admin/RegistrationsPanel.tsx` — clickable rows, naya `RegistrationDetailModal` component (same file ya alag), events fetch me `custom_questions` add.
- Tool call: `configure_social_auth` with `providers: ["google"]` (email NOT disabled).

## Out of scope
- Phone OTP / paid SMS.
- Email/password signup UI for registrants (Google-only as chosen).
- Existing admin password login flow — untouched.
