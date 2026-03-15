# Fourways Webstore - Heroku Deployment Checklist

This checklist is based on the current server setup in `src/index.js` and payment/session flow in your app.

## 1) Pre-flight

- [ ] App runs locally with `npm run dev`
- [ ] `npm start` works (production start command)
- [ ] Stripe webhook works locally with Stripe CLI before deploy
- [ ] Supabase project + keys are correct for production

---

## 2) Heroku app setup

- [ ] Create a Heroku app (`heroku create`)
- [ ] Connect GitHub repo or push branch to Heroku remote
- [ ] Confirm Node buildpack is active (auto-detected for Node apps)
- [ ] Ensure web dyno starts using `npm start`

---

## 3) Required Heroku config vars

Set these in Heroku Config Vars.

### Always required

- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET` (long random value)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVER_SECRET_KEY`
- [ ] `SUPABASE_ANON_KEY` (recommended)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### Recommended production vars

- [ ] `PROD_DOMAIN` (your app origin, e.g. `https://your-app.herokuapp.com`)
- [ ] `PROD_STATIC=public` (defaults to `public` if omitted)

### Optional local-only vars

- [ ] `DEV_DOMAIN`
- [ ] `DEV_STATIC`

### Optional but recommended

- [ ] `REDIS_URL` (if using Heroku Key-Value Store / Redis for session persistence)

> If `REDIS_URL` is missing, app falls back to in-memory sessions. This is okay for simple MVP usage, but sessions/cart may reset on dyno restart.

---

## 4) Redis (optional now, recommended later)

- [ ] Add Heroku Key-Value Store / Redis addon
- [ ] Confirm `REDIS_URL` appears in Config Vars
- [ ] Verify no Redis connection errors in Heroku logs

Why it helps:

- Stable admin login sessions
- Cart/session persistence across dyno restarts and scaling

---

## 5) Stripe webhook setup

- [ ] In Stripe Dashboard, create endpoint:
    - `https://<your-heroku-app>.herokuapp.com/stripe-webhook`
- [ ] Subscribe to `checkout.session.completed`
- [ ] Copy signing secret into `STRIPE_WEBHOOK_SECRET`
- [ ] Confirm endpoint returns `2xx` in Stripe event logs

Notes:

- Webhook route uses raw body parsing before JSON parsing.
- Global rate limiter skips `/stripe-webhook`.

---

## 6) CSP/static/domain sanity checks

- [ ] Open home/product/about pages and verify CSS/JS/images load correctly
- [ ] If scripts/styles are blocked, verify `PROD_DOMAIN` matches deployed origin exactly (including `https://`)
- [ ] Confirm static assets resolve from `/public`

---

## 7) Functional smoke tests (after deploy)

### Storefront

- [ ] Home page renders coffees
- [ ] Product details page renders stock count
- [ ] Add-to-cart + cart drawer work when store is `UP`

### Operational status behavior

- [ ] Set `operational_status.webstore_status = MAINTENANCE`
- [ ] Confirm add-to-cart buttons and cart UI are hidden
- [ ] Confirm checkout attempt redirects to `/maintenance`
- [ ] Set status back to `UP` and retest

### Checkout + orders

- [ ] Complete a test payment
- [ ] Order and order items are saved
- [ ] `retail_available` decrements
- [ ] Admin orders dashboard status actions work as expected

### Admin auth/session

- [ ] Admin login works
- [ ] Session survives browser refresh
- [ ] Logout clears session

---

## 8) Security checks

- [ ] Use a strong `SESSION_SECRET` (rotate if previously exposed)
- [ ] Confirm no secrets are committed in repo
- [ ] Keep Supabase server key server-side only
- [ ] Validate CSP behavior in browser console (no critical violations)

---

## 9) Observability / operations

- [ ] Watch Heroku logs for startup env validation errors
- [ ] Watch for `Unhandled` errors after first traffic
- [ ] Add uptime checks for `/` and one product URL
- [ ] Create rollback plan (previous commit/tag)

---

## 10) First-release go/no-go

Go live only when all below are true:

- [ ] Stripe webhook receiving + processing successfully
- [ ] Checkout end-to-end works
- [ ] Maintenance mode works
- [ ] No repeated 5xx errors in Heroku logs
