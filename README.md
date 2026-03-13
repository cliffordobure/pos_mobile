# POS Mobile Backend

Node.js + Express + MongoDB backend for the POS & Inventory mobile app. Handles shop auth, data sync (cloud backup for paid), and admin dashboard API.

## Setup

1. Install dependencies:
   ```bash
   cd backend && npm install
   ```

2. Create `.env` (copy from `.env.example`):
   ```env
   PORT=4000
   MONGODB_URI=mongodb://127.0.0.1:27017/pos_mobile
   JWT_SECRET=your-secret-for-shop-tokens
   ADMIN_JWT_SECRET=your-admin-secret
   ADMIN_EMAIL=admin@pos.local
   ADMIN_PASSWORD=admin123
   ```

3. Start MongoDB locally (or use a cloud URI).

4. Create the first admin user:
   ```bash
   npm run seed-admin
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## Admin dashboard (web)

1. Build the admin frontend:
   ```bash
   cd ../admin-web && npm install && npm run build
   ```

2. With the backend running, open: **http://localhost:4000/admin**

3. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

## API

- **POST /api/auth/register** – Register shop (name, email, password)
- **POST /api/auth/login** – Login shop (email, password)
- **POST /api/sync/push** – Push products/sales (Paid only, `Authorization: Bearer <token>`)
- **GET /api/sync/pull** – Pull backup (Paid only)
- **POST /api/admin/auth/login** – Admin login
- **GET /api/admin/stats** – Admin: totalRevenue, totalMembers, freePlan, paidPlan
- **GET /api/admin/shops** – Admin: list of shops

## Freemium

- **Free:** 200 product limit, no reports (enforced in app), no cloud sync.
- **Paid:** Unlimited products, reports, cloud backup. Mark a shop as paid and record revenue via **POST /api/admin/subscriptions** (shopId, amount, period) or your payment provider.
