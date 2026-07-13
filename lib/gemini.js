const { slugify } = require("./slug");
const {
  postsBatchPrompt,
  hourlyPostPrompt,
  parseModelJson,
  extractPostsArray
} = require("./content-prompts");
const { mergeGeneratedPosts } = require("./post-merge");

async function generatePostsWithGemini(niche, apiKey) {
  const prompt = `${postsBatchPrompt(niche)}
You may return either { "posts": [...] } or a bare JSON array.`;

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

  const posts = extractPostsArray(parseModelJson(text));
  if (!posts.length) throw new Error("Gemini returned invalid posts array");
  return mergeGeneratedPosts(niche, posts);
}

async function generateHourlyPostWithGemini(niche, existingPosts, apiKey) {
  const prompt = hourlyPostPrompt(niche, existingPosts);

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
  const post = parseModelJson(text);
  if (!post || typeof post !== "object" || !post.title) throw new Error("Gemini returned invalid post");
  return post;
}

module.exports = { parseModelJson, generatePostsWithGemini, generateHourlyPostWithGemini };
