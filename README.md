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

## Run

```bash
npm start
```

## Endpoints

- `GET /` basic status
- `GET /healthz` health check
- `GET /api/store/config` store branding/config
- `GET /api/store/products` product list
- `POST /api/create-checkout` creates a Stripe Checkout session
