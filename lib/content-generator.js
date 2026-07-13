const { slugify } = require("./slug");
const { POSTS_PER_SITE, HOURS_BETWEEN_POSTS, PUBLIC_SITES_DIR } = require("./paths");
const { loadNiches, pickNiche } = require("./niches");
const { loadPostArchive, savePostArchive } = require("./post-archive");
const { postTemplates, hourlyPostTemplate } = require("./templates");
const { generatePostsWithGemini, generateHourlyPostWithGemini } = require("./gemini");
const { writeSiteFiles } = require("./renderer");
const { themeKeyForNiche, THEMES } = require("./themes");

async function generatePosts(niche) {
  const apiKey = process.env.GEMINI_API_KEY;
  let posts;
  if (apiKey) {
    try {
      posts = await generatePostsWithGemini(niche, apiKey);
    } catch (error) {
      console.warn("Gemini generation failed, using templates:", error.message);
    }
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
  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = hourlyPostTemplate(niche, existingPosts.length);
  let post = fallback;

  if (apiKey) {
    try {
      const generated = await generateHourlyPostWithGemini(niche, existingPosts, apiKey);
      post = { ...fallback, ...generated };
      post.pros = Array.isArray(post.pros) && post.pros.length ? post.pros : fallback.pros;
      post.cons = Array.isArray(post.cons) && post.cons.length ? post.cons : fallback.cons;
      post.faq = Array.isArray(post.faq) && post.faq.length ? post.faq : fallback.faq;
      post.tags = Array.isArray(post.tags) && post.tags.length ? post.tags : fallback.tags;
      post.sources = fallback.sources;
    } catch (error) {
      console.warn("Gemini hourly post failed, using template:", error.message);
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
  loadPostArchive,
  savePostArchive,
  writeSiteFiles,
  themeKeyForNiche,
  THEMES,
  POSTS_PER_SITE,
  PUBLIC_SITES_DIR
};
