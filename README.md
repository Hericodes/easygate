# Jiivent

Students at **OOU (Olabisi Onabanjo University)** discover campus events (parties, concerts, programs) and get their tickets in seconds.
Verified organizers create events, sell tickets through Paystack, and scan guests in at the door.

The campus is set in `web/src/lib/campus.ts`, so adding schools later is a small change.

```
Jiivent/
├── web/      Next.js website + REST API (used by the web app and the future mobile app)
└── mobile/   (next) Expo React Native app using the same API
```

## Run it locally

The app uses PostgreSQL. A free [Neon](https://neon.tech) database works well. Use a separate
**dev branch** for local work, so test data never mixes with real users.

```bash
cd web
npm install
cp .env.example .env     # then paste your dev database URLs into .env
npm run db:deploy        # creates the tables
npm run db:seed          # demo accounts + sample events (dev database only!)
npm run dev              # http://localhost:3000
```

Never run `db:seed` against the production database: it creates demo accounts with a known password.

Demo accounts (password `password123`):

| Role      | Email                      |
| --------- | -------------------------- |
| Admin     | admin@easygate.test       |
| Organizer | organizer@easygate.test   |
| Student   | student@easygate.test     |
| Student with a pending organizer application | applicant@easygate.test |

## Roles and reviews

| Role | Can |
| --- | --- |
| Student | Browse events, buy tickets |
| Organizer | Create events (after an admin approves their application), sell tickets, scan guests in |
| Admin | Everything organizers can, plus the admin area: review events and organizer applications, change Student ↔ Organizer, look up orders |
| Super admin | Everything admins can, plus add and remove admins |

- Everyone signs up as a student. To sell tickets, a student applies at **/organizers/apply**; admins approve at **/admin/applications**.
- **Every new event waits for review.** Organizers' events stay hidden until an admin approves them at **/admin/events**
  (admins' own events go live straight away). Admins can also reject an event, or take a live one down, with a reason the organizer sees.
- The admin area is at **/admin**: Overview, Events, Organizers, Users and Orders.
- Admins are added by the super admin under **Admin → Users**. To create the first (super) admin, sign up, then run
  `npm run make-admin -- their@email.com --super` with `DATABASE_URL` in `.env` pointing at the database you want to change.

## Deploying (GitHub + Vercel)

1. Push this repository to GitHub.
2. On [vercel.com/new](https://vercel.com/new), import the repository and set **Root Directory** to `web`.
3. Add these environment variables in Vercel (Settings → Environment Variables):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Production database, pooled connection string |
   | `DATABASE_URL_UNPOOLED` | Production database, direct connection string (optional with Neon: worked out from `DATABASE_URL`) |
   | `AUTH_SECRET` | A new long random string, 32+ characters (not the dev one). The build refuses to deploy without it |
   | `PAYSTACK_SECRET_KEY` | `sk_test_…` to test payments, `sk_live_…` for real money |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Same as local (optional) |
   | `APP_URL` | Optional, e.g. `https://jiivent.vercel.app` |

4. Deploy. Every deploy runs `npm run vercel-build`, which applies database migrations, then builds.
5. After the first deploy:
   - Add `https://YOUR-DOMAIN/api/auth/google/callback` to the Google OAuth client's redirect URIs.
   - Set the Paystack webhook URL to `https://YOUR-DOMAIN/api/payments/webhook`.
   - Sign up on the live site, then make yourself admin (see above, using the production database URL).

Every push to `main` deploys automatically. Servers run in Frankfurt (`web/vercel.json`), close to Nigeria;
create the Neon database in the same region (AWS Europe Central / Frankfurt).

## Google sign-in

"Continue with Google" appears on the login and sign-up pages once these are set in `web/.env`:

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) and create a project if you don't have one.
2. Set up the **OAuth consent screen**: External, app name "Jiivent", your support email.
3. **Create credentials → OAuth client ID → Web application**, then add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://YOUR-DOMAIN/api/auth/google/callback` (when you deploy)
4. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then restart `npm run dev`.

If a Google email matches an existing account, Google is linked to it. Otherwise a new student account is created.
Google-only accounts can add a password later on the Account page.

## Payments (Paystack)

- **No key set (development):** paid tickets go to a mock checkout page with "simulate success / failure" buttons.
- **Real payments:** put your secret key in `web/.env` as `PAYSTACK_SECRET_KEY` (use `sk_test_…` first).
  In the Paystack dashboard, set the webhook URL to `{APP_URL}/api/payments/webhook`.

Tickets are issued only after the payment is verified with Paystack, either on the redirect back
(`/api/payments/verify`) or by the webhook. Issuing is idempotent, so both can fire safely.
If tickets sell out while someone is paying, the order is marked FAILED and needs a refund from the Paystack dashboard.

## Features

- **Discovery:** search and filter upcoming OOU events by type.
- **Tickets:** multiple ticket types (Regular, VIP, free), up to 10 per order, each with a unique QR code (`JV-XXXXXXXXXX`).
- **Check-in:** camera QR scanner plus manual code entry. Each ticket can be used only once, even with several scanners at the door.
- **Organizer dashboard:** sales, revenue, check-in counts and attendee list per event.
- **Organizer applications:** students apply and admins approve or reject them.
- **Ticket history** (`/tickets/history`): every order (paid, failed, not completed) with amount, date and payment reference, plus total spent, tickets bought and events attended.
- **Profile** (`/account`): profile photo, ticket stats, your next event, name/email/phone, sign-in methods and password, log out.
- **Flyers:** organizers upload the event flyer (no links). Students see the whole flyer on event cards and the event page, and can open it full screen.
- **Link previews:** sharing an event link on WhatsApp, X, Facebook, Telegram or iMessage shows the flyer (or a branded card with the event details) plus the date, venue and price. The picture is made by `/api/events/:slug/share-image`.

## Pictures (flyers and profile photos)

Pictures are shrunk in the browser before upload (flyers to 1600 px, profile photos to a 512 px square, as WebP),
so each is usually under 400 KB. They're stored in the database (`Image` table) and served at `/api/images/:id` with a one-year cache,
so Vercel's CDN serves repeat views without touching the database. Only JPEG, PNG and WebP are accepted (checked from the file
itself), up to 3 MB, and at most 40 uploads per account per hour. Flyers that were uploaded but never used on an event are
deleted after a day; a replaced profile photo is deleted straight away.

Neon's free plan has 0.5 GB of storage, roughly 1,500 or more flyers. If you outgrow it, move pictures to
Vercel Blob or Cloudinary; only `src/lib/images.ts` and `/api/images/:id` need to change.

## API (for the mobile app)

Login and signup return a `token`. Send it as `Authorization: Bearer <token>`. The web app uses a cookie instead.

| Method | Path                         | Who       | Purpose                                              |
| ------ | ---------------------------- | --------- | ---------------------------------------------------- |
| POST   | /api/auth/signup             | anyone    | `{name,email,password}` → `{token,user}`             |
| POST   | /api/auth/login              | anyone    | `{email,password}` → `{token,user}`                  |
| GET    | /api/auth/me                 | anyone    | current user or null                                 |
| GET    | /api/events                  | anyone    | `?q=&category=`                                      |
| GET    | /api/events/:slug            | anyone    | event + ticket types                                 |
| POST   | /api/events                  | organizer | create event with `ticketTypes[]` and optional `imageUrl` (from /api/uploads) |
| POST   | /api/uploads                 | organizer | multipart `file` (flyer) → `{url}`                   |
| GET    | /api/images/:id              | anyone    | an uploaded picture                                  |
| POST   | /api/account/avatar          | logged in | multipart `file` → `{avatarUrl}`; DELETE removes it  |
| POST   | /api/orders                  | logged in | `{ticketTypeId,quantity}` → `{redirectUrl}`          |
| GET    | /api/orders                  | logged in | my order history + summary totals                    |
| GET    | /api/tickets                 | logged in | my tickets with QR data URLs                         |
| PATCH  | /api/account                 | logged in | `{name,email,phone?}`                                |
| POST   | /api/account/password        | logged in | `{currentPassword,newPassword}`                      |
| POST   | /api/checkin                 | organizer | `{eventId,code}` → VALID / ALREADY_USED / …          |
| GET    | /api/organizer-applications  | logged in | my latest application                                |
| POST   | /api/organizer-applications  | logged in | `{orgName,phone,eventTypes,socialHandle?,message?}`  |
| POST   | /api/admin/applications/:id  | admin     | `{action: "APPROVE" or "REJECT", note?}`             |

## Not built yet

- Emailing tickets to buyers, and notifying applicants when they're approved
- Editing or cancelling events after publishing; organizer payouts (Paystack subaccounts)
- The mobile app
