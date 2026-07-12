#!/usr/bin/env node
"use strict";

const { generateBlogSite } = require("../lib/blog-site-generator");

async function main() {
  const result = await generateBlogSite();
  console.log(JSON.stringify({ ok: true, site: result.site }, null, 2));
  if (result.site.vercel) {
    console.log(`Standalone Vercel deployment: ${result.site.vercel.url}`);
  } else {
    console.log("No standalone Vercel deployment (set VERCEL_TOKEN to enable).");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
