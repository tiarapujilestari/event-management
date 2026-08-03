# Eventify — Event Ticket Booking Platform

A full-stack event ticketing platform (Eventbrite-inspired) with Customer, Organizer, and Admin roles.

```
event-platform/
├── backend/    Express + TypeScript + Prisma + PostgreSQL API
└── frontend/   React 19 + TypeScript + Vite + TailwindCSS
```

## What's included

- **Auth**: register/login/logout, JWT access + refresh tokens (httpOnly cookie), remember me, forgot/reset password, email verification, referral-code registration with automatic reward distribution (10,000 points to referrer / 10% coupon to referee, both expiring in 3 months)
- **RBAC**: CUSTOMER / ORGANIZER / ADMIN roles, protected routes on both API and frontend
- **Events**: full CRUD, image gallery, categories, cities, geolocation (Google Maps embed), debounced search (500ms), filters (category/city/price/date/organizer/status), sorting (newest/popular/price), pagination
- **Checkout**: cart → voucher/coupon/points discount stacking → Prisma `$transaction` for atomic seat allocation → Midtrans Sandbox payment session → webhook confirms payment and issues tickets
- **Reviews**: attendees-only rating + comment + organizer replies
- **Organizer dashboard**: revenue/ticket charts (Recharts), event management, attendee list + CSV export, voucher management
- **Admin dashboard**: user/event/transaction management, categories & cities management, platform-wide analytics
- **Vouchers & referral system**: percentage/fixed discounts, usage limits, expiry, minimum purchase, max discount cap
- **Background schedulers**: auto-expire unpaid orders (releases seats), auto-expire referral points
- **Testing**: Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- **Docs**: Swagger UI at `/api-docs`

## Prerequisites

- Node.js 20+
- A PostgreSQL database — the fastest way is a free [Neon](https://neon.tech) project
- (Optional) [Midtrans Sandbox](https://dashboard.sandbox.midtrans.com) account for payments
- (Optional) [Cloudinary](https://cloudinary.com) account for avatar/image uploads
- (Optional) SMTP credentials (e.g. Gmail App Password) for transactional emails

The app **runs without** Midtrans/Cloudinary/SMTP configured — payments will error gracefully, uploads will fail gracefully, and emails are just logged to the console instead of sent. Everything else works out of the box.

## 1. Set up the database (Neon)

1. Create a free project at https://neon.tech
2. Copy the connection string it gives you (starts with `postgresql://...sslmode=require`)
3. You'll paste it into `backend/.env` in the next step

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env and paste your Neon DATABASE_URL, and set two random long strings for
# JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (e.g. `openssl rand -hex 32`)

npm install
npx prisma generate
npx prisma migrate dev --name init   # creates all tables in your Neon database
npx prisma db seed                   # seeds categories, cities, demo users, sample events

npm run dev                          # starts API on http://localhost:8000
```

Demo accounts created by the seed script:

| Role      | Email                          | Password       |
|-----------|---------------------------------|-----------------|
| Organizer | organizer@eventplatform.com     | Organizer123!   |
| Customer  | customer@eventplatform.com      | Customer123!    |

API docs: http://localhost:8000/api-docs
Health check: http://localhost:8000/health

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# VITE_API_URL defaults to http://localhost:8000/api — change if your backend runs elsewhere

npm install
npm run dev                          # starts app on http://localhost:5173
```

Open http://localhost:5173 and log in with any of the demo accounts above.

## 4. Running tests

```bash
# Backend (Jest + Supertest) — requires DATABASE_URL configured in .env
cd backend && npm test

# Frontend (Vitest + React Testing Library)
cd frontend && npm test
```

## 5. Deployment

### Database — Neon (already done in step 1)
Nothing further needed; Neon is already production-ready Postgres.

### Backend — Railway
1. Push the `backend/` folder to a GitHub repo (or connect the monorepo and set the root directory to `backend`)
2. Create a new Railway project → **Deploy from GitHub repo**
3. Set the root/working directory to `backend`
4. Add all variables from `backend/.env.example` under Railway's **Variables** tab (use your real Neon `DATABASE_URL`, generate fresh JWT secrets, set `CLIENT_URL` to your Vercel URL once deployed)
5. Set the build command: `npm install && npx prisma generate && npm run build`
6. Set the start command: `npx prisma migrate deploy && npm start`
7. Deploy — Railway will give you a public URL like `https://your-app.up.railway.app`

### Frontend — Vercel
1. Push `frontend/` to GitHub (or set the root directory to `frontend` in a monorepo import)
2. Import the repo into Vercel
3. Framework preset: **Vite**
4. Set the environment variable `VITE_API_URL` to `https://your-railway-app.up.railway.app/api`
5. Deploy

### After both are live
1. Update `CLIENT_URL` in your Railway backend env vars to your Vercel domain (needed for CORS + cookies), then redeploy the backend
2. Update your Midtrans dashboard's payment notification URL to `https://your-railway-app.up.railway.app/api/payments/webhook`

## Environment variables reference

See `backend/.env.example` and `frontend/.env.example` for the full list with comments.

## Notes on scope

This is a complete, runnable full-stack starter covering the core booking flow end-to-end (auth, browsing/search/filter, event CRUD, checkout with atomic seat locking, payments, reviews, referrals, and all three role dashboards). It is intentionally not an exhaustive implementation of every possible admin/organizer edge case (e.g. fine-grained report builders, advanced fraud rules) — the architecture (Prisma schema, route/controller/service layering, RBAC) is built so those can be added incrementally without restructuring anything.
