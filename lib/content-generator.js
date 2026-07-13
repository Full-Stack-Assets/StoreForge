const { slugify } = require("./slug");
const { POSTS_PER_SITE, HOURS_BETWEEN_POSTS, PUBLIC_SITES_DIR } = require("./paths");
const { loadNiches, pickNiche } = require("./niches");
const { loadPostArchive, savePostArchive } = require("./post-archive");
const { postTemplates, hourlyPostTemplate } = require("./templates");
const {
  contentModeLabel,
  isAiContentEnabled,
  isGeminiEnabled,
  generatePostsWithProvider,
  generateHourlyPostWithProvider
} = require("./content-provider");
const { writeSiteFiles } = require("./renderer");
const { themeKeyForNiche, THEMES } = require("./themes");

let loggedContentMode = false;

function logContentModeOnce() {
  if (loggedContentMode) return;
  loggedContentMode = true;
  const mode = contentModeLabel();
  if (mode === "template") {
    console.log("Content mode: template (no AI API key — using editorial templates)");
    return;
  }
  console.log(`Content mode: ${mode}`);
}

async function generatePosts(niche) {
  let posts;
  if (isAiContentEnabled()) {
    try {
      posts = await generatePostsWithProvider(niche);
    } catch (error) {
      console.warn(`${contentModeLabel()} generation failed, using templates:`, error.message);
    }
  } else {
    logContentModeOnce();
  }
  posts = posts || postTemplates(niche);

  const now = Date.now();
  const seen = new Set();
  return posts.map((post, index) => {
    let slug = post.slug;
    let suffix = 2;
    while (seen.has(slug)) slug = `${post.slug}-${suffix++}`;
    seen.add(slug);
    const wordCount = [post.whatHappened, post.whyItMatters, post.howToThink].join(" ").split(/\s+/).length;
    return {
      ...post,
      slug,
      publishedAt: new Date(now - index * HOURS_BETWEEN_POSTS * 3600 * 1000).toISOString(),
      readMinutes: Math.max(2, Math.round(wordCount / 180) + 1)
    };
  });
}

async function generateHourlyPost(niche, existingPosts) {
  const fallback = hourlyPostTemplate(niche, existingPosts.length);
  let post = fallback;

  if (isAiContentEnabled()) {
    try {
      const generated = await generateHourlyPostWithProvider(niche, existingPosts);
      if (generated) {
        post = { ...fallback, ...generated };
        post.pros = Array.isArray(post.pros) && post.pros.length ? post.pros : fallback.pros;
        post.cons = Array.isArray(post.cons) && post.cons.length ? post.cons : fallback.cons;
        post.faq = Array.isArray(post.faq) && post.faq.length ? post.faq : fallback.faq;
        post.tags = Array.isArray(post.tags) && post.tags.length ? post.tags : fallback.tags;
        post.sources = fallback.sources;
      }
    } catch (error) {
      console.warn(`${contentModeLabel()} hourly post failed, using template:`, error.message);
    }
  }

  const existingSlugs = new Set(existingPosts.map((entry) => entry.slug));
  let slug = slugify(post.slug || post.title).slice(0, 60);
  let suffix = 2;
  while (existingSlugs.has(slug)) slug = `${slugify(post.slug || post.title).slice(0, 56)}-${suffix++}`;

  const wordCount = [post.whatHappened, post.whyItMatters, post.howToThink].join(" ").split(/\s+/).length;
  return {
    ...post,
    slug,
    publishedAt: new Date().toISOString(),
    readMinutes: Math.max(2, Math.round(wordCount / 180) + 1)
  };
}

module.exports = {
  loadNiches,
  pickNiche,
  generatePosts,
  generateHourlyPost,
  isAiContentEnabled,
  isGeminiEnabled,
  contentModeLabel,
  loadPostArchive,
  savePostArchive,
  writeSiteFiles,
  themeKeyForNiche,
  THEMES,
  POSTS_PER_SITE,
  PUBLIC_SITES_DIR
};
