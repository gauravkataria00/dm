# Production Deployment Checklist (Auth + User Isolation)

Use this checklist for current codebase state (JWT auth, protected APIs, per-user data isolation).

## 1) Backend Environment (`server/.env`)

- [ ] `NODE_ENV=production`
- [ ] `PORT=5000` (or hosting provider port)
- [ ] `MONGODB_URI=<production mongodb uri>`
- [ ] `JWT_SECRET=<long random secret, 32+ chars>`
- [ ] `JWT_EXPIRES_IN=7d` (or your policy)
- [ ] `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
- [ ] `FRONTEND_URL=https://your-frontend-domain.com`
- [ ] `RATE_LIMIT_WINDOW_MS=60000`
- [ ] `RATE_LIMIT_MAX=200`

## 2) Frontend Environment (`webapp/.env`)

- [ ] `VITE_API_BASE_URL=https://your-backend-domain.com`
- [ ] Do **not** include `/api` in `VITE_API_BASE_URL`

## 3) Backend Deploy Validation

- [ ] `GET /health` returns healthy or degraded JSON
- [ ] `POST /api/auth/signup` returns token
- [ ] `POST /api/auth/login` returns token
- [ ] Protected route without token returns `401`
- [ ] Protected route with token returns `200`

## 4) User Isolation Validation (Critical)

- [ ] Create User A and User B
- [ ] User A creates records (clients/milk/payments/advances/etc.)
- [ ] User B cannot see User A records in list endpoints
- [ ] User B cannot update/delete User A record IDs

## 5) Frontend Deploy Validation

- [ ] Login works and redirects to dashboard
- [ ] Logout clears session and redirects to login
- [ ] Add client/milk/payment flows work from UI
- [ ] Ledger delete works in production domain
- [ ] Language toggle works (EN/HI) on auth/layout UI

## 6) Security Go-Live Checks

- [ ] Never commit real `.env` files
- [ ] Rotate any previously leaked DB credentials
- [ ] Confirm HTTPS is enforced by platform
- [ ] Confirm CORS is restricted to production frontend domain
- [ ] Confirm rate limit active on `/api/*`

## 7) Rollback Plan

- [ ] Keep last stable backend deployment ID/tag
- [ ] Keep last stable frontend deployment ID/tag
- [ ] If errors spike, rollback both to last stable release
- [ ] Re-test auth + core CRUD + isolation after rollback

## 8) Post-Deploy Monitoring (First 24h)

- [ ] Watch server logs for `401`, `429`, and `500` spikes
- [ ] Watch DB connection errors/reconnect loops
- [ ] Verify response times for `/api/milk` and `/api/clients`
- [ ] Smoke test once every few hours with real account
