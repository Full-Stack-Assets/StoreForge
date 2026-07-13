#!/usr/bin/env node
"use strict";

const registry = require("../lib/registry");
const content = require("../lib/content-generator");
const vercel = require("../lib/vercel-deployer");
const { getBaseUrl } = require("../lib/config");
const { mapWithConcurrency } = require("../lib/concurrency");

const SITE_CONCURRENCY = Number(process.env.SITE_CONCURRENCY || 4);

function nicheForSite(site, niches) {
  return (
    niches.find((entry) => entry.id === site.nicheId) || {
      id: site.nicheId,
      name: site.name,
      audience: site.audience,
      categories: site.categories,
      subreddits: [site.nicheId],
      braveQueries: site.categories.map((category) => category.toLowerCase())
    }
  );
}

async function rebuildSite(site, { deploy, baseUrl, niches, fresh }) {
  const niche = nicheForSite(site, niches);
  let posts = fresh ? [] : content.loadPostArchive(site.slug);
  if (posts.length === 0) {
    posts = await content.generatePosts(niche);
  }

  site.postCount = posts.length;
  const siteDir = content.writeSiteFiles(site, posts, baseUrl);
  const result = { slug: site.slug, design: site.design, postCount: posts.length, deployUrl: null };

  if (deploy && vercel.isConfigured()) {
    try {
      const deployment = await vercel.deploySiteToVercel(site, siteDir);
      site.vercel = deployment;
      site.url = deployment.url;
      result.deployUrl = deployment.url;
    } catch (error) {
      console.warn(`  ${site.slug} deploy failed: ${error.message}`);
    }
  }

  return result;
}

async function main() {
  const deploy = process.argv.includes("--deploy");
  const fresh = process.argv.includes("--fresh");
  const baseUrl = getBaseUrl();
  const data = registry.loadRegistry();
  const niches = content.loadNiches();

  const results = await mapWithConcurrency(data.sites, SITE_CONCURRENCY, (site) =>
    rebuildSite(site, { deploy, baseUrl, niches, fresh })
  );

  for (const result of results) {
    console.log(`rebuilt ${result.slug} (theme: ${result.design}, ${result.postCount} posts)`);
    if (result.deployUrl) console.log(`  deployed → ${result.deployUrl}`);
  }

  registry.saveRegistry(data);
  console.log(`Done: ${data.sites.length} sites rebuilt.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
