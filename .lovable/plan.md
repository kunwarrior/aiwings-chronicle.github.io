## Problem

`supabase.auth.signInWithOtp({ email })` is being called correctly, but users receive a **magic link** in their email instead of a **6-digit code**. The frontend then shows the "Enter code" screen, but there is no code to enter.

**Root cause:** The default Lovable Cloud auth email template for magic link / signup uses `{{ .ConfirmationURL }}` (a clickable link). To deliver a numeric OTP, the template must use `{{ .Token }}` instead. Without a custom template, Cloud sends the default link-based email.

## Fix

Scaffold custom Lovable auth email templates and switch the magic-link + signup templates to render `{{ .Token }}` as a 6-digit code (link removed / de-emphasized). This makes the actual email match what the UI expects.

### Steps

1. **Check email domain status** (`email_domain--check_email_domain_status`).
   - If no sender domain is configured, open the email setup dialog so the user can add one. Auth OTP emails require a configured sender.
2. **Scaffold auth email templates** (`email_domain--scaffold_auth_email_templates`).
3. **Edit the scaffolded templates** in `supabase/functions/_shared/email-templates/`:
   - `magic-link.tsx` → show a large, styled 6-digit code from `{{ .Token }}`, remove the "click this link" CTA. Copy: "Your verification code" + code + "expires in 1 hour".
   - `signup.tsx` → same treatment (since sign-up via OTP also flows through this template).
   - Match app branding (colors from `src/index.css`, "The AI Wings" name).
4. **Deploy** the `auth-email-hook` function (`supabase--deploy_edge_functions`).
5. **Verify** by triggering an OTP from the Register flow and confirming the email now contains a 6-digit code.

### Frontend

No changes needed — `EventDetail.tsx` already calls `signInWithOtp` and `verifyOtp({ type: 'email', token })`, which accepts the 6-digit code.

### Notes

- DNS verification isn't required for scaffolding; if DNS is still propagating, the default link email may continue briefly until activation completes in Cloud → Emails.
- Password login flow is unaffected.
