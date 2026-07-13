const { slugify } = require("./slug");
const { postTemplates } = require("./templates");
const { POSTS_PER_SITE } = require("./paths");

function parseGeminiJson(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}
async function generatePostsWithGemini(niche, apiKey) {
  const prompt = `You are the editor of an automated niche blog. Return ONLY valid JSON (no markdown fences): an array of exactly ${POSTS_PER_SITE} posts.
Each post object must have exactly these fields:
{
  "slug": "kebab-case",
  "title": "string",
  "category": "one of: ${niche.categories.join(", ")}",
  "dek": "one-sentence standfirst under 160 chars",
  "takeaway": "one-sentence key takeaway",
  "whatHappened": "2-3 sentence paragraph",
  "whyItMatters": "2-3 sentence paragraph",
  "howToThink": "2-3 sentence paragraph of practical advice",
  "pros": ["3 short strings"],
  "cons": ["3 short strings"],
  "watchOut": "one-sentence caution",
  "faq": [{"q": "string", "a": "string"}, {"q": "string", "a": "string"}, {"q": "string", "a": "string"}],
  "tags": ["2 short strings"]
}
Niche: ${niche.name}
Audience: ${niche.audience}
Categories: ${niche.categories.join(", ")}
Tone: punchy, editorial, practical — a trend brief for ${niche.audience}. No fluff.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  const posts = parseGeminiJson(text);
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error("Gemini returned invalid posts array");
  }

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

async function generateHourlyPostWithGemini(niche, existingPosts, apiKey) {
  const recentTitles = existingPosts.slice(0, 12).map((post) => post.title);
  const prompt = `You are the editor of "${niche.name}", an automated dispatch blog for ${niche.audience}.
Write ONE new post. Return ONLY valid JSON (no markdown fences) as a single object with exactly these fields:
{
  "slug": "kebab-case",
  "title": "string — must NOT overlap these recent titles: ${JSON.stringify(recentTitles)}",
  "category": "one of: ${niche.categories.join(", ")}",
  "dek": "one-sentence standfirst under 160 chars",
  "takeaway": "one-sentence key takeaway",
  "whatHappened": "2-3 sentence paragraph",
  "whyItMatters": "2-3 sentence paragraph",
  "howToThink": "2-3 sentence paragraph of practical advice",
  "pros": ["3 short strings"],
  "cons": ["3 short strings"],
  "watchOut": "one-sentence caution",
  "faq": [{"q": "string", "a": "string"}, {"q": "string", "a": "string"}, {"q": "string", "a": "string"}],
  "tags": ["2 short strings"]
}
Tone: punchy, editorial, practical. Stay strictly on the niche: ${niche.categories.join(", ")} for ${niche.audience}.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
      })
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  const post = parseGeminiJson(text);
  if (!post || typeof post !== "object" || !post.title) throw new Error("Gemini returned invalid post");
  return post;
}

module.exports = { parseGeminiJson, generatePostsWithGemini, generateHourlyPostWithGemini };
