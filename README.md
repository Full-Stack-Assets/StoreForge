# StoreForge

Blog forge + storefront API. StoreForge continuously deploys new niche blog sites and serves a live stream dashboard at `/`.

## What you get

- **`/`** — live dashboard of all deployed blog sites (auto-refreshes every 60s)
- **`/sites/{slug}/`** — generated niche blog sites with starter posts
- **Hourly GitHub Action** — commits a new site to `public/sites/` and redeploys on Vercel
- **Store API** — products + Stripe Checkout (unchanged)

## Requirements

- Node.js 18+
- Stripe secret key (optional, for checkout only)
- Gemini API key (optional, for AI-written starter posts)

## Setup

```bash
npm install
cp .env.example .env
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `STOREFORGE_URL` | Recommended | Public URL used in generated blog links |
| `CRON_SECRET` | For manual API trigger | Protects `POST /api/blog-sites/generate` |
| `GEMINI_API_KEY` | Optional | AI-generated posts (templates used if unset) |
| `STRIPE_SECRET_KEY` | Checkout only | Stripe Checkout sessions |
| `FRONTEND_URL` | Checkout only | Stripe success/cancel redirects |
| `STORE_NAME` | No | Store branding in `/api/store/config` |
| `CORS_ORIGIN` | No | Comma-separated CORS allowlist |

## Run locally

```bash
npm start
# open http://localhost:3000/
```

Generate a blog site manually:

```bash
npm run generate:blog-site
```

## Continuous blog deployment

### GitHub Actions (recommended)

Workflow: `.github/workflows/hourly-blog-site.yml`

Runs at **:15 every hour** (staggered from on-the-hour jobs). Each run:

1. Picks an unused niche from `data/niches.json`
2. Writes static HTML to `public/sites/{slug}/`
3. Updates `data/blog-sites.json`
4. Commits and pushes → Vercel redeploys

**Required GitHub secrets:**

| Secret | Required | Purpose |
|--------|----------|---------|
| `STOREFORGE_URL` | Yes | e.g. `https://your-project.vercel.app` |
| `GEMINI_API_KEY` | No | AI post generation |
| `VERCEL_DEPLOY_HOOK_URL` | No | Force immediate redeploy after commit |

Trigger manually: **Actions → Hourly blog site deployment → Run workflow**

### On-demand via API

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/blog-sites/generate \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Set `CRON_SECRET` in Vercel env vars.

## Deploy to Vercel

StoreForge uses [Vercel zero-config Express](https://vercel.com/docs/frameworks/backend/express). Static blog sites in `public/sites/` are served by the Vercel CDN.

1. Import `Full-Stack-Assets/StoreForge` at [vercel.com/new](https://vercel.com/new)
2. Set `STOREFORGE_URL` to your production URL
3. Enable GitHub Actions on the repo for hourly site generation
4. Deploy

### Verify

```bash
curl -I https://YOUR-PROJECT.vercel.app/
curl https://YOUR-PROJECT.vercel.app/api/blog-sites
curl https://YOUR-PROJECT.vercel.app/sites/retro-pixel-press/
curl https://YOUR-PROJECT.vercel.app/api/status
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Live blog stream dashboard (HTML) |
| `GET` | `/api/status` | API health JSON |
| `GET` | `/healthz` | Health check |
| `GET` | `/api/blog-sites` | All deployed blog sites |
| `POST` | `/api/blog-sites/generate` | Generate + register a new site (auth required) |
| `GET` | `/sites/{slug}/` | Generated blog site |
| `GET` | `/api/store/config` | Store branding |
| `GET` | `/api/store/products` | Product list |
| `POST` | `/api/create-checkout` | Stripe Checkout session |

## Scaling to separate domains

Each generated site lives under `/sites/{slug}/` on your StoreForge domain. To spin up **standalone domains** (like your Astrokobi template clones), use [Full-Stack-Assets/-Astrokobi.com](https://github.com/Full-Stack-Assets/-Astrokobi.com) as a template and point hourly post generation at each repo. StoreForge handles the **continuous stream of new sites** on one deployment; Astrokobi handles **continuous posts** per domain.
