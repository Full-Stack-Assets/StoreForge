#!/usr/bin/env node
"use strict";

// Adds one fresh post to every registered site and re-renders it, so sites
// keep publishing hourly after launch. Pass --deploy (or set VERCEL_TOKEN)
// to also push each updated site to its standalone Vercel project.

const registry = require("../lib/registry");
const content = require("../lib/content-generator");
const vercel = require("../lib/vercel-deployer");
const { getBaseUrl } = require("../lib/blog-site-generator");

async function main() {
  const deploy = process.argv.includes("--deploy") || vercel.isConfigured();
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

    let archive = content.loadPostArchive(site.slug);
    if (archive.length === 0) {
      archive = await content.generatePosts(niche);
    }

    const post = await content.generateHourlyPost(niche, archive);
    const posts = [post, ...archive];

    site.postCount = posts.length;
    site.lastPostAt = post.publishedAt;
    const siteDir = content.writeSiteFiles(site, posts, baseUrl);
    console.log(`${site.slug}: +"${post.title}" (${posts.length} posts)`);

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

  data.lastPostRunAt = new Date().toISOString();
  registry.saveRegistry(data);
  console.log(`Done: 1 new post added to each of ${data.sites.length} sites.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
