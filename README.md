# StoreForge

Blog forge + storefront API. StoreForge continuously deploys new niche blog sites and serves a live stream dashboard at `/`.

## What you get

- **`/`** — live dashboard of all deployed blog sites (auto-refreshes every 60s)
- **`/sites/{slug}/`** — generated niche blog sites with starter posts
- **Standalone Vercel deployments** — each new site is deployed to its own Vercel project (e.g. `storeforge-{slug}.vercel.app`) when `VERCEL_TOKEN` is set
- **Hourly GitHub Action** — generates a new site, deploys it to its own Vercel project, and commits a copy to `public/sites/`
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
| `VERCEL_TOKEN` | For standalone deploys | Deploys each new site to its own Vercel project |
| `VERCEL_TEAM_ID` | Team scopes only | Vercel team the per-site projects belong to |
| `VERCEL_PROJECT_PREFIX` | No | Per-site project name prefix (default `storeforge`) |
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
3. Deploys the new site to **its own Vercel project** (`{prefix}-{slug}.vercel.app`)
4. Updates `data/blog-sites.json` with the standalone URL
5. Commits and pushes → main dashboard redeploys

**GitHub secrets:**

| Secret | Required | Purpose |
|--------|----------|---------|
| `STOREFORGE_URL` | Yes | e.g. `https://your-project.vercel.app` |
| `VERCEL_TOKEN` | For standalone deploys | Vercel API token used to create one project per site |
| `VERCEL_TEAM_ID` | Team scopes only | Vercel team ID for the per-site projects |
| `GEMINI_API_KEY` | No | AI post generation |
| `VERCEL_DEPLOY_HOOK_URL` | No | Force immediate dashboard redeploy after commit |

**GitHub variables (optional):** `VERCEL_PROJECT_PREFIX` — prefix for per-site project names (default `storeforge`).

Without `VERCEL_TOKEN`, generation still works: sites are only served from `public/sites/{slug}/` on the main deployment, as before.

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

## Standalone deployments per site

With `VERCEL_TOKEN` set, every generated site is deployed to its own Vercel project named `{VERCEL_PROJECT_PREFIX}-{slug}` (default prefix `storeforge`), reachable at `https://{project-name}.vercel.app`. The dashboard links to the standalone URL and keeps a "Local copy" link to the `/sites/{slug}/` copy on the main deployment. The generated HTML uses only relative links, so the same files work in both places. You can attach a custom domain to any per-site project from the Vercel dashboard.

For richer standalone sites (like the Astrokobi template clones), use [Full-Stack-Assets/-Astrokobi.com](https://github.com/Full-Stack-Assets/-Astrokobi.com) as a template and point hourly post generation at each repo.
