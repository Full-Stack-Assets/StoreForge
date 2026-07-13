const { slugify } = require("./slug");
const { postTemplates } = require("./templates");
const { POSTS_PER_SITE } = require("./paths");

function mergeGeneratedPosts(niche, posts) {
  const fallbacks = postTemplates(niche);
  return posts.slice(0, POSTS_PER_SITE).map((post, index) => {
    const fallback = fallbacks[index % fallbacks.length];
    const merged = { ...fallback, ...post };
    merged.slug = slugify(merged.slug || merged.title).slice(0, 60) || fallback.slug;
    merged.pros = Array.isArray(merged.pros) && merged.pros.length ? merged.pros : fallback.pros;
    merged.cons = Array.isArray(merged.cons) && merged.cons.length ? merged.cons : fallback.cons;
    merged.faq = Array.isArray(merged.faq) && merged.faq.length ? merged.faq : fallback.faq;
    merged.tags = Array.isArray(merged.tags) && merged.tags.length ? merged.tags : fallback.tags;
    merged.sources = fallback.sources;
    return merged;
  });
}

module.exports = { mergeGeneratedPosts };
