# FrameFinder — AI photo delivery for event photographers

Production SaaS codebase. Photographers upload event photos into ceremony folders
(Haldi / Mehndi / Sangeet / Marriage), AI groups faces on-device, clients star
their album picks from a shareable gallery file, and photographers sell photos
with INR pricing + WhatsApp ordering. One event free (up to 200 photos) — then
paid plans via Razorpay.

## Publish

This repo is local-only until published. With the GitHub CLI authenticated:

```bash
cd ~/workspace/framefinder
gh repo create framefinder --public --source=. --push
# if the name is taken:
gh repo create framefinder-app --public --source=. --push
```

## Architecture

```
Next.js 14 (App Router, TypeScript strict, Tailwind)
├── app/page.tsx            Marketing landing (CTAs → /login, /studio)
├── app/login, app/auth/callback   Supabase email-OTP auth
├── app/pricing             Plans + Razorpay checkout
├── app/studio/*            Photographer workspace (auth-gated by middleware.ts)
│   ├── [eventId]           Folders, uploads, photo grid, lightbox
│   ├── [eventId]/people    Client-side face detection + grouping (face-api.js, /public/models)
│   ├── [eventId]/search    Selfie face search (sensitivity slider)
│   ├── [eventId]/selected  Selected smart folder + client-selection import
│   └── [eventId]/settings  Pricing, watermark, WhatsApp, client-gallery export
├── app/api/*               Events, folders, photos, selections, billing
├── lib/                    plans, entitlements, razorpay, selection-codec, supabase clients
├── middleware.ts           Redirects unauthenticated /studio/* → /login
├── public/models/          Bundled face-api.js weights (no runtime CDN needed)
└── supabase/migrations/    0001 profiles → 0002 events/folders/photos → 0003 selections/subscriptions → 0004 storage
```

**Data flow:** browser uploads photos straight to the private Supabase Storage
bucket `event-photos` (`{userId}/{eventId}/{folderId}/{filename}`), then POSTs a
metadata row. Face detection runs 100% on-device (face-api.js) — photos never
leave the browser for AI. Quota checks (`1 free event`, `200 free photos`) run
**server-side** in the API routes and in `lib/entitlements.ts` — never trusted
from the client. Billing: Razorpay order API → checkout.js → `/api/billing/verify`
(HMAC check) + `/api/billing/webhook` (signature-verified, service-role client).

## Local dev setup

Prereqs: Node 18+, npm, a Supabase project, Razorpay test keys.

```bash
cd ~/workspace/framefinder
npm install
cp .env.example .env.local
# fill in .env.local (see .env.example for every key)

# 1. Supabase: create a project at https://supabase.com/dashboard
# 2. Run migrations IN ORDER: open the SQL editor and run
#    supabase/migrations/0001_profiles.sql
#    supabase/migrations/0002_events_folders_photos.sql
#    supabase/migrations/0003_selections_subscriptions.sql
#    supabase/migrations/0004_storage.sql
# 3. Auth: Supabase Dashboard → Authentication → enable Email provider.
#    URL Configuration: Site URL = http://localhost:3000, and add
#    http://localhost:3000/auth/callback to Redirect URLs.

npm run dev   # http://localhost:3000
```

## Production deploy (step by step)

1. **Supabase project** — create at supabase.com (free tier is fine to start).
   Run the 4 migrations in order via the SQL editor. Note the API URL + anon key.
2. **Auth** — Supabase Dashboard → Authentication → URL Configuration:
   Site URL = `https://YOUR-DOMAIN`, Redirect URLs add
   `https://YOUR-DOMAIN/auth/callback`.
3. **Razorpay** — dashboard.razorpay.com → Settings → API Keys: create key pair
   (use **test** keys first, switch to **live** after KYC). Settings → Webhooks:
   add webhook `https://YOUR-DOMAIN/api/billing/webhook`, subscribe to
   `payment.captured`, copy the webhook secret.
4. **Vercel** — vercel.com → Add New Project → import this repo. Set all
   variables from `.env.example` (with `NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN`).
   Deploy.
5. **Custom domain** — buy `framefinder.in` (or similar, ~₹800/yr) from any
   registrar, add it in Vercel → Project → Settings → Domains, and update the
   Supabase Site URL / redirect URLs + Razorpay webhook URL to the domain.
6. Smoke test: sign up via email OTP → create 1 event → upload photos →
   export client gallery → test checkout with a Razorpay test payment.

## What only the owner can do

Jarvis cannot do these — they need your identity, money, or KYC:

- [ ] Buy a domain (~₹800/yr, e.g. framefinder.in)
- [ ] Create Supabase account + project (free tier OK)
- [ ] Create Razorpay account and complete KYC (test keys work before KYC; live payments need it)
- [ ] Create Vercel account and connect this repo
- [ ] Paste the 8 keys from `.env.example` into Vercel env vars
- [ ] Point the Razorpay webhook at `https://YOUR-DOMAIN/api/billing/webhook`

## Feature status

Complete: landing, email-OTP auth, middleware-gated Studio, events/folders/photos
CRUD, direct-to-storage uploads, on-device face detection + People grouping,
selfie Search, Selected smart folder, client-selection import (WhatsApp paste or
file, auto-star + match report), client gallery HTML export (compressed previews,
star selection, Finish-via-WhatsApp), INR pricing + text watermarks + WhatsApp
ordering, Razorpay orders/verification/webhook, quota enforcement (402 paywall),
pricing page.

Intentionally not built: Reels/video generation (cut from the product), Beam
camera-to-cloud FTP (needs a capture-side agent + server — backend phase),
server-side face recognition (client-side is faster and cheaper), true live
client↔photographer sync (file/WhatsApp handoff instead — zero server cost).
