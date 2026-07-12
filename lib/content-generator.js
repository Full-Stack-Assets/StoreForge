const fs = require("fs");
const path = require("path");

const NICHES_PATH = path.join(__dirname, "..", "data", "niches.json");
const PUBLIC_SITES_DIR = path.join(__dirname, "..", "public", "sites");

function loadNiches() {
  return JSON.parse(fs.readFileSync(NICHES_PATH, "utf8"));
}

function pickNiche(usedNicheIds) {
  const niches = loadNiches();
  const unused = niches.filter((niche) => !usedNicheIds.has(niche.id));
  const pool = unused.length > 0 ? unused : niches;
  return pool[Math.floor(Math.random() * pool.length)];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function postTemplates(niche) {
  const topic = niche.categories[0] || niche.name;
  return [
    {
      slug: "welcome",
      title: `Welcome to ${niche.name}`,
      excerpt: `Your new home for ${niche.audience}. Fresh posts land here automatically.`,
      body: `<p>${niche.name} is a continuously deployed niche blog built by StoreForge. Each site spins up on its own schedule with starter posts you can expand over time.</p><p>This edition focuses on <strong>${topic}</strong> and related topics for ${niche.audience}.</p>`
    },
    {
      slug: "starter-guide",
      title: `Starter guide: ${topic}`,
      excerpt: `A practical opening post for readers interested in ${niche.audience}.`,
      body: `<p>Getting started in ${topic.toLowerCase()} does not require perfect gear or a huge budget. Focus on one repeatable workflow, measure what works, and iterate weekly.</p><ul><li>Pick one sub-topic from ${niche.categories.join(", ")}</li><li>Publish a short update every few days</li><li>Link out to communities like r/${niche.subreddits[0]}</li></ul>`
    },
    {
      slug: "what-to-watch",
      title: `What to watch in ${niche.categories[1] || topic}`,
      excerpt: `Trending angles sourced from ${niche.braveQueries[0]}.`,
      body: `<p>Readers searching for "${niche.braveQueries[0]}" usually want concrete examples, not theory. Lead with a checklist, then add one opinionated recommendation.</p><p>StoreForge will keep deploying new niche sites like this one on an hourly cadence when the pipeline is connected.</p>`
    }
  ];
}

async function generatePostsWithGemini(niche, apiKey) {
  const prompt = `You are a blog writer. Return ONLY valid JSON (no markdown fences) as an array of exactly 3 posts.
Each post: { "slug": "kebab-case", "title": "string", "excerpt": "string under 160 chars", "body": "HTML paragraph string" }
Niche: ${niche.name}
Audience: ${niche.audience}
Categories: ${niche.categories.join(", ")}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const posts = JSON.parse(cleaned);
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error("Gemini returned invalid posts array");
  }
  return posts.slice(0, 3);
}

async function generatePosts(niche) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      return await generatePostsWithGemini(niche, apiKey);
    } catch (error) {
      console.warn("Gemini generation failed, using templates:", error.message);
    }
  }
  return postTemplates(niche);
}

function renderSiteHtml(site, posts, baseUrl) {
  const siteRoot = `${baseUrl}/sites/${site.slug}`;
  const postCards = posts
    .map(
      (post) => `<article class="card">
        <h2><a href="${siteRoot}/posts/${post.slug}.html">${escapeHtml(post.title)}</a></h2>
        <p>${escapeHtml(post.excerpt)}</p>
        <a class="read-more" href="${siteRoot}/posts/${post.slug}.html">Read →</a>
      </article>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(site.name)}</title>
  <meta name="description" content="${escapeHtml(site.tagline)}" />
  <link rel="stylesheet" href="/sites/_assets/blog.css" />
</head>
<body>
  <header class="hero">
    <p class="eyebrow">StoreForge Blog · ${escapeHtml(site.nicheId)}</p>
    <h1>${escapeHtml(site.name)}</h1>
    <p class="tagline">${escapeHtml(site.tagline)}</p>
  </header>
  <main class="grid">${postCards}</main>
  <footer class="footer">
    <p>Deployed ${escapeHtml(new Date(site.createdAt).toUTCString())}</p>
    <p><a href="${baseUrl}/">← Back to StoreForge stream</a></p>
  </footer>
</body>
</html>`;
}

function renderPostHtml(site, post, baseUrl) {
  const siteRoot = `${baseUrl}/sites/${site.slug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(post.title)} · ${escapeHtml(site.name)}</title>
  <link rel="stylesheet" href="/sites/_assets/blog.css" />
</head>
<body>
  <header class="hero compact">
    <p class="eyebrow"><a href="${siteRoot}/">${escapeHtml(site.name)}</a></p>
    <h1>${escapeHtml(post.title)}</h1>
  </header>
  <main class="article">${post.body}</main>
  <footer class="footer">
    <p><a href="${siteRoot}/">← All posts</a> · <a href="${baseUrl}/">StoreForge stream</a></p>
  </footer>
</body>
</html>`;
}

function writeSiteFiles(site, posts, baseUrl) {
  const siteDir = path.join(PUBLIC_SITES_DIR, site.slug);
  const postsDir = path.join(siteDir, "posts");
  fs.mkdirSync(postsDir, { recursive: true });

  fs.writeFileSync(path.join(siteDir, "index.html"), renderSiteHtml(site, posts, baseUrl), "utf8");

  for (const post of posts) {
    const filename = `${post.slug}.html`;
    fs.writeFileSync(path.join(postsDir, filename), renderPostHtml(site, post, baseUrl), "utf8");
  }
}

module.exports = {
  loadNiches,
  pickNiche,
  generatePosts,
  writeSiteFiles,
  PUBLIC_SITES_DIR
};
