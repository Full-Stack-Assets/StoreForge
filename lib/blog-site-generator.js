const { slugify } = require("./slug");
const registry = require("./registry");
const content = require("./content-generator");
const vercel = require("./vercel-deployer");

function getBaseUrl() {
  const configured = (process.env.STOREFORGE_URL || process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  return "https://www.beyondmythos.com";
}

async function generateBlogSite(options = {}) {
  const niche = options.niche || content.pickNiche(registry.getUsedNicheIds());
  if (!niche) {
    const error = new Error("All niches in data/niches.json are already used — add more to keep launching sites.");
    error.code = "NICHES_EXHAUSTED";
    throw error;
  }
  const baseSlug = slugify(niche.name);
  let slug = baseSlug;
  let suffix = 2;
  while (registry.slugExists(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const createdAt = new Date().toISOString();
  const baseUrl = getBaseUrl();
  const posts = await content.generatePosts(niche);

  const site = {
    id: `${slug}-${Date.now()}`,
    slug,
    name: niche.name,
    tagline: `Fresh takes for ${niche.audience}.`,
    nicheId: niche.id,
    audience: niche.audience,
    categories: niche.categories,
    url: `${baseUrl}/sites/${slug}/`,
    localUrl: `${baseUrl}/sites/${slug}/`,
    vercel: null,
    design: content.themeKeyForNiche(niche.id),
    postCount: posts.length,
    createdAt
  };

  const siteDir = content.writeSiteFiles(site, posts, baseUrl);

  // Deploy the new site as its own standalone Vercel project. Failures are
  // non-fatal: the site still ships inside the main deployment at localUrl.
  if (vercel.isConfigured() && options.deploy !== false) {
    try {
      const deployment = await vercel.deploySiteToVercel(site, siteDir);
      site.vercel = deployment;
      site.url = deployment.url;
    } catch (error) {
      console.warn(`Standalone Vercel deployment failed for ${slug}: ${error.message}`);
    }
  }

  registry.registerSite(site);

  return { site, posts, niche };
}

module.exports = { generateBlogSite, getBaseUrl };
