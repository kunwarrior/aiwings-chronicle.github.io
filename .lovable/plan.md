
# Aage kya add karna hai — Public + Admin dono

Aapka site core (events, registrations, payments, gallery, team, admin panel, cascade delete) already kaafi solid hai. Yeh plan sirf un cheezon pe focus hai jo missing/weak hain aur jinka real impact hoga.

---

## Part A — Public website ke liye (users)

### 1. Branded email notifications
Abhi koi automatic email nahi jaata. Add karna:
- **Custom email domain** setup (jaise `noreply@theaiwings.in`) — Lovable Cloud built-in email infra use karke.
- **Registration confirmation email** — jaise hi user form submit kare, usko receipt mile (event name, fee, kya next steps).
- **Payment verified email** — admin jab "paid" mark kare, user ko auto email jaye "Your spot is confirmed".
- Sab emails branded template (club logo, colors).

### 2. "My registrations" page (logged-in user)
Google login already hai but user ko khud apni registrations dikhti nahi. Add:
- `/my` route — logged-in user apni saari registrations, payment status, event details dekh sake.
- "Cancel registration" button (sirf agar event abhi tak nahi hua).

### 3. Event detail page polish + countdown
`EventDetail.tsx` page hai — usme add:
- Live **countdown timer** (event start tak).
- **"Seats left" indicator** (agar admin ne max capacity set kiya).
- **Share buttons** (WhatsApp, copy link) — students ke liye event spread karna easy.

### 4. SEO + sharing
- Proper `<title>`, meta description, Open Graph image (jab WhatsApp/LinkedIn pe share ho toh preview aaye).
- Sitemap.xml + robots.txt update.
- JSON-LD structured data (Event schema) for Google.

### 5. Optional: Blog / Resources section
Members ke liye AI tutorials, club announcements post karne ki jagah. Admin se manage ho.

---

## Part B — Admin / backend tools

### 6. Max capacity per event
Events table me `max_seats` field. Jab fill ho jaye, registration form auto-close. Admin ko dashboard pe "45/60 seats" dikhe.

### 7. Bulk email from admin
Admin panel me "Send email to all paid registrants of this event" button — reminders, venue change, etc. Lovable email infra use karega.

### 8. Better analytics dashboard
Admin home pe stat cards already hain. Add:
- Registrations over time (chart, last 30 days).
- Revenue per event (bar chart).
- Conversion funnel: views → registered → paid.

### 9. CSV/Excel export improvements
Already CSV export hai. Add:
- Filter by date range.
- Export **only paid** / only pending shortcut.
- Excel format (.xlsx) bhi support (abhi sirf CSV).

### 10. Audit log
Kis admin ne kaunsa change kab kiya — chhota log table. Future me agar dispute ho ya delete revert karna ho.

### 11. Storage usage indicator
Aapne pucha tha storage ka — admin panel pe ek widget jo dikhaye "Used: 245 MB / 1 GB" with breakdown (event posters, payment screenshots, gallery).

---

## Recommended order (mera suggestion)

Agar sab nahi karna toh **top 4 highest-impact**:

1. **Branded emails** (#1) — biggest user trust boost, professional feel.
2. **Max capacity per event** (#6) — abhi koi limit nahi hai, over-registration ho sakta hai.
3. **"My registrations" page** (#2) — Google login already hai, user value double.
4. **SEO + OG image** (#4) — WhatsApp pe share hone pe pretty preview = zyada signups.

---

## Out of scope (abhi nahi)
- Payment gateway integration (Razorpay/Stripe) — abhi manual UPI + screenshot flow hi rakhenge.
- Mobile app.
- Realtime chat / community.

---

## Aap batao
Konse points implement karu? Top 4 (1, 6, 2, 4) recommend karta hoon — ya aap khud pick karo numbers se (e.g. "1, 3, 6 karo").
