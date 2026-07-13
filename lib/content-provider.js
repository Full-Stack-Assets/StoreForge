const {
  postsBatchPrompt,
  hourlyPostPrompt,
  extractPostsArray
} = require("./content-prompts");
const { chatCompletion } = require("./providers/openai-compatible");
const { generatePostsWithGemini, generateHourlyPostWithGemini } = require("./gemini");
const { mergeGeneratedPosts } = require("./post-merge");

const PLACEHOLDER_KEYS = new Set([
  "",
  "your-gemini-key",
  "your_gemini_key",
  "gemini-api-key",
  "your-groq-key",
  "your-openai-key",
  "your-openrouter-key",
  "changeme",
  "xxx",
  "placeholder",
  "sk-xxx"
]);

const PROVIDERS = {
  groq: {
    label: "groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    modelEnv: "GROQ_MODEL",
    temperature: { batch: 0.8, hourly: 0.9 },
    maxTokens: { batch: 8192, hourly: 4096 }
  },
  openrouter: {
    label: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemma-2-9b-it:free",
    modelEnv: "OPENROUTER_MODEL",
    temperature: { batch: 0.8, hourly: 0.9 },
    maxTokens: { batch: 8192, hourly: 4096 },
    extraHeaders: () => ({
      "HTTP-Referer": process.env.BEYONDMYTHOS_URL || process.env.STOREFORGE_URL || "https://www.beyondmythos.com",
      "X-Title": "BeyondMythos"
    })
  },
  openai: {
    label: "openai",
    envKey: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    modelEnv: "OPENAI_MODEL",
    temperature: { batch: 0.8, hourly: 0.9 },
    maxTokens: { batch: 8192, hourly: 4096 }
  },
  gemini: {
    label: "gemini",
    envKey: "GEMINI_API_KEY"
  }
};

const AUTO_PROVIDER_ORDER = ["groq", "openrouter", "openai", "gemini"];

function isTruthyFlag(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function isPlaceholderKey(key) {
  return !key || PLACEHOLDER_KEYS.has(String(key).trim().toLowerCase());
}

function providerApiKey(providerName) {
  const provider = PROVIDERS[providerName];
  if (!provider?.envKey) return null;
  const key = (process.env[provider.envKey] || "").trim();
  return isPlaceholderKey(key) ? null : key;
}

function resolveContentProvider() {
  if (isTruthyFlag(process.env.DISABLE_AI_CONTENT) || isTruthyFlag(process.env.DISABLE_GEMINI)) {
    return "template";
  }

  const requested = (process.env.CONTENT_PROVIDER || "auto").trim().toLowerCase();
  if (requested === "template") return "template";

  if (requested !== "auto") {
    return providerApiKey(requested) ? requested : "template";
  }

  for (const name of AUTO_PROVIDER_ORDER) {
    if (providerApiKey(name)) return name;
  }
  return "template";
}

function contentModeLabel() {
  return resolveContentProvider();
}

function isAiContentEnabled() {
  return resolveContentProvider() !== "template";
}

/** @deprecated use isAiContentEnabled */
function isGeminiEnabled() {
  return resolveContentProvider() === "gemini";
}

async function generatePostsWithOpenAiCompatible(providerName, niche, apiKey) {
  const provider = PROVIDERS[providerName];
  const model = (process.env[provider.modelEnv] || provider.defaultModel).trim();
  const parsed = await chatCompletion({
    baseUrl: provider.baseUrl,
    apiKey,
    model,
    prompt: postsBatchPrompt(niche),
    temperature: provider.temperature.batch,
    maxTokens: provider.maxTokens.batch,
    extraHeaders: provider.extraHeaders ? provider.extraHeaders() : {}
  });
  const posts = extractPostsArray(parsed);
  if (!posts.length) throw new Error(`${providerName} returned empty posts array`);
  return mergeGeneratedPosts(niche, posts);
}

async function generateHourlyPostWithOpenAiCompatible(providerName, niche, existingPosts, apiKey) {
  const provider = PROVIDERS[providerName];
  const model = (process.env[provider.modelEnv] || provider.defaultModel).trim();
  const post = await chatCompletion({
    baseUrl: provider.baseUrl,
    apiKey,
    model,
    prompt: hourlyPostPrompt(niche, existingPosts),
    temperature: provider.temperature.hourly,
    maxTokens: provider.maxTokens.hourly,
    extraHeaders: provider.extraHeaders ? provider.extraHeaders() : {}
  });
  if (!post || typeof post !== "object" || !post.title) {
    throw new Error(`${providerName} returned invalid post`);
  }
  return post;
}

async function generatePostsWithProvider(niche) {
  const providerName = resolveContentProvider();
  if (providerName === "template") return null;

  const apiKey = providerApiKey(providerName);
  if (providerName === "gemini") {
    return generatePostsWithGemini(niche, apiKey);
  }
  return generatePostsWithOpenAiCompatible(providerName, niche, apiKey);
}

async function generateHourlyPostWithProvider(niche, existingPosts) {
  const providerName = resolveContentProvider();
  if (providerName === "template") return null;

  const apiKey = providerApiKey(providerName);
  if (providerName === "gemini") {
    return generateHourlyPostWithGemini(niche, existingPosts, apiKey);
  }
  return generateHourlyPostWithOpenAiCompatible(providerName, niche, existingPosts, apiKey);
}

module.exports = {
  PROVIDERS,
  AUTO_PROVIDER_ORDER,
  resolveContentProvider,
  contentModeLabel,
  isAiContentEnabled,
  isGeminiEnabled,
  generatePostsWithProvider,
  generateHourlyPostWithProvider
};
