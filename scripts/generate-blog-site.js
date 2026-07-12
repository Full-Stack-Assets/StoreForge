#!/usr/bin/env node
"use strict";

const { generateBlogSite } = require("../lib/blog-site-generator");

async function main() {
  const result = await generateBlogSite();
  console.log(JSON.stringify({ ok: true, site: result.site }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
