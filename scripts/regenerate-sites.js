#!/usr/bin/env node
"use strict";

// Rebuilds every site in data/blog-sites.json with the current templates and
// theme presets. Pass --deploy to also push each rebuilt site to its own
// Vercel project (requires VERCEL_TOKEN).

const registry = require("../lib/registry");
const content = require("../lib/content-generator");
const vercel = require("../lib/vercel-deployer");
const { getBaseUrl } = require("../lib/blog-site-generator");

async function main() {
  const deploy = process.argv.includes("--deploy");
  const baseUrl = getBaseUrl();
  const data = registry.loadRegistry();
  const niches = content.loadNiches();

  for (const site of data.sites) {
    const niche = niches.find((entry) => entry.id === site.nicheId) || {
      id: site.nicheId,
      name: site.name,
      audience: site.audience,
      categories: site.categories,
      subreddits: [site.nicheId],
      braveQueries: site.categories.map((category) => category.toLowerCase())
    };

    const posts = await content.generatePosts(niche);
    site.postCount = posts.length;
    const siteDir = content.writeSiteFiles(site, posts, baseUrl);
    console.log(`rebuilt ${site.slug} (theme: ${site.design}, ${posts.length} posts)`);

    if (deploy && vercel.isConfigured()) {
      try {
        const deployment = await vercel.deploySiteToVercel(site, siteDir);
        site.vercel = deployment;
        site.url = deployment.url;
        console.log(`  deployed → ${deployment.url}`);
      } catch (error) {
        console.warn(`  deploy failed: ${error.message}`);
      }
    }
  }

  registry.saveRegistry(data);
  console.log(`Done: ${data.sites.length} sites rebuilt.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
