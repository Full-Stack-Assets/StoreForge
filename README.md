# StoreForge

Simple Express API for a storefront demo (products + Stripe Checkout).

## Requirements

- Node.js 18+
- Stripe secret key (for checkout)

## Setup

```bash
npm install
```

### Environment variables
Copy `.env.example` to `.env` and fill in the values for local development.

- `PORT` (optional): defaults to `3000`
- `STORE_NAME` (optional): displayed in `/api/store/config`
- `STRIPE_SECRET_KEY` (required for `/api/create-checkout`)
- `FRONTEND_URL` (required for `/api/create-checkout` unless requests include an `Origin` header)
- `CORS_ORIGIN` (optional): comma-separated allowlist of origins (defaults to allowing all origins)

## Run locally

```bash
npm start
```

## Deploy to Vercel

StoreForge uses [Vercel's zero-config Express support](https://vercel.com/docs/frameworks/backend/express). The root `server.js` exports the Express app and is detected automatically.

### 1. Import the repo

1. Open [vercel.com/new](https://vercel.com/new)
2. Import `Full-Stack-Assets/StoreForge`
3. Leave the framework preset as **Express** (auto-detected)
4. No build command or output directory is required

### 2. Set environment variables

In the Vercel project **Settings → Environment Variables**, add:

| Variable | Required | Example |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | Yes (checkout) | `sk_live_...` |
| `FRONTEND_URL` | Yes (checkout) | `https://your-storefront.vercel.app` |
| `STORE_NAME` | No | `StoreForge` |
| `CORS_ORIGIN` | No | `https://your-storefront.vercel.app` |

Apply to **Production**, **Preview**, and **Development** as needed.

### 3. Deploy

- **Git push:** Merging to `main` triggers a production deploy when the repo is linked.
- **CLI:** `npx vercel --prod` from the project root (requires the [Vercel CLI](https://vercel.com/docs/cli) and login).

### 4. Verify

After deploy, check:

```bash
curl https://YOUR-PROJECT.vercel.app/
curl https://YOUR-PROJECT.vercel.app/healthz
curl https://YOUR-PROJECT.vercel.app/api/store/products
```

Expected root response:

```json
{"status":"ok","message":"StoreForge API is running"}
```

## Endpoints

- `GET /` basic status
- `GET /healthz` health check
- `GET /api/store/config` store branding/config
- `GET /api/store/products` product list
- `POST /api/create-checkout` creates a Stripe Checkout session
