# BeyondMythos

Blog forge + storefront API. BeyondMythos continuously deploys new niche blog sites and serves a live stream dashboard at `/`.

## What you get

- **`/`** — live dashboard of all deployed blog sites (auto-refreshes every 60s)
- **`/sites/{slug}/`** — generated niche blog sites with starter posts
- **Standalone Vercel deployments** — each new site is deployed to its own Vercel project (e.g. `beyondmythos-{slug}.vercel.app`) when `VERCEL_TOKEN` is set
- **Hourly site generation** — `.github/workflows/hourly-blog-site.yml` creates a brand-new niche site every hour at :15
- **Hourly posts** — `.github/workflows/hourly-posts.yml` adds one fresh post to *every* existing site at :45 and redeploys its standalone project, so sites keep publishing continuously (Gemini-written when `GEMINI_API_KEY` is set, rotating editorial archetypes otherwise)
- **Store API** — 30+ products (merch, digital guides, dropship accessories) with catalog-validated Stripe Checkout

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
| `BEYONDMYTHOS_URL` | Recommended | Public URL used in generated blog links |
| `STOREFORGE_URL` | Legacy alias | Same as `BEYONDMYTHOS_URL` (backward compatible) |
| `VERCEL_TOKEN` | For standalone deploys | Deploys each new site to its own Vercel project |
| `VERCEL_TEAM_ID` | Team scopes only | Vercel team the per-site projects belong to |
| `VERCEL_PROJECT_PREFIX` | No | Per-site project name prefix (default `beyondmythos`) |
| `CRON_SECRET` | For manual API trigger | Protects `POST /api/blog-sites/generate` |
| `GEMINI_API_KEY` | Optional | AI-generated posts (templates used if unset) |
| `STRIPE_SECRET_KEY` | Checkout only | Stripe Checkout sessions |
| `FRONTEND_URL` | Checkout only | Stripe success/cancel redirects |
| `STORE_NAME` | No | Store branding in `/api/store/config` |
| `CORS_ORIGIN` | No | Comma-separated CORS allowlist |
| `SITE_CONCURRENCY` | No | Parallel site processing in hourly scripts (default `4`) |

## Run locally

```bash
npm start
# open http://localhost:3000/
```

Generate a blog site manually:

```bash
npm run generate:blog-site
```

Rebuild every existing site with the current templates/themes (add `-- --deploy` to also redeploy each to its Vercel project):

```bash
npm run regenerate:sites
```

Add one new post to every site (what the hourly workflow runs; deploys automatically when `VERCEL_TOKEN` is set):

```bash
npm run add:posts
```

Post content is persisted per site in `data/posts/{slug}.json`, so the archive grows hour over hour and survives regeneration.

## Store catalog

Products are defined server-side in `lib/products.js` and sold via Stripe Checkout. Clients send only `{ id, quantity }` — prices are never trusted from the browser.

| Category | Type | Examples |
|----------|------|----------|
| `accessories` | physical (dropship) | Chargers, hubs, laptop stand, ring light |
| `merch` | physical (dropship) | Logo tee, hoodie, cap, tote, stickers, mug |
| `templates` | digital | Starter kit, prompt library, brand kit, theme presets |
| `guides` | digital | SEO playbook, monetization toolkit, automation guide |

Filter the catalog: `GET /api/store/products?type=digital` or `?category=merch`.

Digital products are limited to one per order. Stripe line items include fulfillment metadata for post-purchase automation.

## Site design

Generated sites follow the "dispatch" format of the reference network (wireandlogic.com, moviesrule.com, astrokobi.com, nextgengear.cc): sticky gradient-ruled header, gradient-text masthead, featured post + 3-column card grid, and a templated article layout (Takeaway callout → What happened / Why it matters / How to think about it → Pros & Cons → Watch out → FAQ accordion → numbered Sources → tags → newsletter CTA → Keep reading). Each niche gets one of six theme presets (`zine`, `cinema`, `aurora`, `prism`, `ember`, `moss`) defined in `lib/content-generator.js`, plus a per-site RSS feed and About page.

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
| `BEYONDMYTHOS_URL` or `STOREFORGE_URL` | Yes | e.g. `https://your-project.vercel.app` |
| `VERCEL_TOKEN` | For standalone deploys | Vercel API token used to create one project per site |
| `VERCEL_TEAM_ID` | Team scopes only | Vercel team ID for the per-site projects |
| `GEMINI_API_KEY` | No | AI post generation |
| `VERCEL_DEPLOY_HOOK_URL` | No | Force immediate dashboard redeploy after commit |

**GitHub variables (optional):** `VERCEL_PROJECT_PREFIX` — prefix for per-site project names (default `beyondmythos`).

Without `VERCEL_TOKEN`, generation still works: sites are only served from `public/sites/{slug}/` on the main deployment, as before.

Trigger manually: **Actions → Hourly blog site deployment → Run workflow**

### On-demand via API

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/blog-sites/generate \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Set `CRON_SECRET` in Vercel env vars.

## Deploy to Vercel

BeyondMythos uses [Vercel zero-config Express](https://vercel.com/docs/frameworks/backend/express). Static blog sites in `public/sites/` are served by the Vercel CDN.

1. Import `Full-Stack-Assets/StoreForge` at [vercel.com/new](https://vercel.com/new)
2. Set `BEYONDMYTHOS_URL` (or `STOREFORGE_URL`) to your production URL
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
| `GET` | `/api/store/config` | Store branding, categories, and product types |
| `GET` | `/api/store/products` | Product list (`?type=digital`, `?category=merch`, `?fulfillment=dropship`) |
| `POST` | `/api/create-checkout` | Stripe Checkout session (catalog-validated; send `{ id, quantity }` per item) |

## Standalone deployments per site

With `VERCEL_TOKEN` set, every generated site is deployed to its own Vercel project named `{VERCEL_PROJECT_PREFIX}-{slug}` (default prefix `beyondmythos`), reachable at `https://{project-name}.vercel.app`. The dashboard links to the standalone URL and keeps a "Local copy" link to the `/sites/{slug}/` copy on the main deployment. The generated HTML uses only relative links, so the same files work in both places. You can attach a custom domain to any per-site project from the Vercel dashboard.

## Code layout

Core modules under `lib/`:

| Module | Responsibility |
|--------|----------------|
| `content-generator.js` | Orchestrates post generation |
| `templates.js` | Editorial post blueprints |
| `gemini.js` | Gemini API integration |
| `renderer.js` | HTML/CSS site rendering |
| `products.js` | Server-side store catalog |
| `checkout.js` | Checkout validation |
| `config.js` | Shared URL and Vercel config |

Run tests with `npm test`.
