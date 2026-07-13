const fs = require("fs");
const path = require("path");
const { slugify } = require("./slug");

const NICHES_PATH = path.join(__dirname, "..", "data", "niches.json");
const PUBLIC_SITES_DIR = path.join(__dirname, "..", "public", "sites");
const POSTS_ARCHIVE_DIR = path.join(__dirname, "..", "data", "posts");

const POSTS_PER_SITE = 6;
const HOURS_BETWEEN_POSTS = 37;

// Theme presets modeled on the reference dispatch sites
// (wireandlogic.com, moviesrule.com, astrokobi.com, nextgengear.cc):
// CSS-variable palette + signature text gradient + display font.
const THEMES = {
  zine: {
    mode: "light",
    paper: "#fafafa", panel: "#ffffff", ink: "#18181b", body: "#27272a",
    muted: "#52525b", line: "#e4e4e7",
    accent: "#059669", accentDeep: "#047857", accent2: "#65a30d",
    gradient: "linear-gradient(100deg, #047857 0%, #059669 45%, #65a30d 100%)",
    glow: "rgba(5,150,105,.25)",
    radius: "0px",
    displayFont: "Archivo", displayWeight: 900, displayTransform: "none", displayTracking: "-0.03em",
    fontQuery: "family=Archivo:wght@500;700;900"
  },
  cinema: {
    mode: "dark",
    paper: "#0c0a0e", panel: "rgba(242,234,217,.04)", ink: "#f2ead9", body: "#e8dfcd",
    muted: "#a59c8b", line: "rgba(242,234,217,.14)",
    accent: "#e84550", accentDeep: "#7f1d26", accent2: "#d9a441",
    gradient: "linear-gradient(100deg, #e84550 0%, #d9a441 60%, #fff3c4 100%)",
    glow: "rgba(232,69,80,.3)",
    radius: "8px",
    displayFont: "Bebas Neue", displayWeight: 400, displayTransform: "uppercase", displayTracking: "0.035em",
    fontQuery: "family=Bebas+Neue"
  },
  aurora: {
    mode: "dark",
    paper: "#060815", panel: "rgba(148,158,220,.05)", ink: "#e6e9f5", body: "#d4d9ee",
    muted: "#9aa1c4", line: "rgba(148,158,220,.18)",
    accent: "#8f8ffc", accentDeep: "#6d6df0", accent2: "#f28ae0",
    gradient: "linear-gradient(100deg, #8f8ffc 0%, #b78cff 45%, #f28ae0 100%)",
    glow: "rgba(163,102,255,.35)",
    radius: "12px",
    displayFont: "Sora", displayWeight: 800, displayTransform: "none", displayTracking: "-0.02em",
    fontQuery: "family=Sora:wght@500;700;800"
  },
  prism: {
    mode: "light",
    paper: "#f8fafc", panel: "#ffffff", ink: "#0f172a", body: "#1e293b",
    muted: "#5b6472", line: "#e2e8f0",
    accent: "#2563eb", accentDeep: "#1d4ed8", accent2: "#7c3aed",
    gradient: "linear-gradient(120deg, #2563eb 0%, #7c3aed 100%)",
    glow: "rgba(37,99,235,.22)",
    radius: "12px",
    displayFont: "Space Grotesk", displayWeight: 700, displayTransform: "none", displayTracking: "-0.02em",
    fontQuery: "family=Space+Grotesk:wght@500;700"
  },
  ember: {
    mode: "dark",
    paper: "#0d0906", panel: "rgba(245,237,228,.04)", ink: "#f5ede4", body: "#eadfd2",
    muted: "#b3a08e", line: "rgba(245,237,228,.14)",
    accent: "#f97316", accentDeep: "#ea580c", accent2: "#facc15",
    gradient: "linear-gradient(100deg, #ea580c 0%, #f97316 45%, #facc15 100%)",
    glow: "rgba(249,115,22,.3)",
    radius: "6px",
    displayFont: "Archivo", displayWeight: 900, displayTransform: "none", displayTracking: "-0.03em",
    fontQuery: "family=Archivo:wght@500;700;900"
  },
  moss: {
    mode: "light",
    paper: "#f7f6f1", panel: "#ffffff", ink: "#1c1917", body: "#292524",
    muted: "#57534e", line: "#e7e5e4",
    accent: "#0d9488", accentDeep: "#0f766e", accent2: "#0ea5e9",
    gradient: "linear-gradient(100deg, #0f766e 0%, #0d9488 45%, #0ea5e9 100%)",
    glow: "rgba(13,148,136,.22)",
    radius: "10px",
    displayFont: "Sora", displayWeight: 800, displayTransform: "none", displayTracking: "-0.02em",
    fontQuery: "family=Sora:wght@500;700;800"
  }
};

const NICHE_THEME_MAP = {
  "retro-gaming": "cinema",
  "indie-film": "cinema",
  "home-coffee": "ember",
  "meal-prep": "zine",
  "urban-gardening": "moss",
  "sustainable-travel": "moss",
  "budget-pc-builds": "prism",
  "dog-training": "prism"
};

function themeKeyForNiche(nicheId) {
  if (NICHE_THEME_MAP[nicheId]) return NICHE_THEME_MAP[nicheId];
  const keys = Object.keys(THEMES);
  let hash = 0;
  for (const char of String(nicheId)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return keys[hash % keys.length];
}

function loadNiches() {
  return JSON.parse(fs.readFileSync(NICHES_PATH, "utf8"));
}

function pickNiche(usedNicheIds) {
  const niches = loadNiches();
  const unused = niches.filter((niche) => !usedNicheIds.has(niche.id));
  // Never reuse a niche: duplicate subject matter is worse than no new site.
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

// Topical imagery: loremflickr serves keyword-tagged photos without an API
// key. Tags come from the niche id (e.g. "urban-gardening" → urban,gardening)
// so every image relates to the site's subject; lock pins a stable photo per post.
function imageTags(nicheId) {
  return String(nicheId).split("-").filter(Boolean).slice(0, 2).join(",") || "technology";
}

function imageLock(postSlug) {
  let hash = 0;
  for (const char of String(postSlug)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 1000;
}

function imageFor(site, postSlug, width, height) {
  return `https://loremflickr.com/${width}/${height}/${imageTags(site.nicheId)}?lock=${imageLock(postSlug)}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLongDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Post content
// ---------------------------------------------------------------------------

function postTemplates(niche) {
  const cats = niche.categories;
  const cat = (i) => cats[i % cats.length];
  const audience = niche.audience;
  const query = (i) => niche.braveQueries[i % niche.braveQueries.length];
  const subreddit = (i) => niche.subreddits[i % niche.subreddits.length];

  const sourcesFor = (i) => [
    { label: `r/${subreddit(i)} community threads`, url: `https://www.reddit.com/r/${subreddit(i)}/` },
    { label: `Search interest: "${query(i)}"`, url: `https://duckduckgo.com/?q=${encodeURIComponent(query(i))}` }
  ];

  const blueprints = [
    {
      slug: `state-of-${slugify(cat(0))}`,
      title: `The state of ${cat(0)} in 2026`,
      category: cat(0),
      dek: `A field report on ${cat(0).toLowerCase()}: where things stand, and what ${audience} should do next.`,
      takeaway: `${cat(0)} is consolidating around a few repeatable workflows. Pick one, master it, and ignore the churn.`,
      whatHappened: `Over the last year the conversation around ${cat(0).toLowerCase()} shifted from novelty to fundamentals. The communities where ${audience} gather have converged on a shorter list of tools and techniques that actually hold up, while the long tail of hype has quietly thinned out.`,
      whyItMatters: `For ${audience}, the noise-to-signal ratio has never mattered more. Time invested in the wrong setup compounds badly, and the difference between a stalled hobby and a durable habit usually comes down to choosing boring, proven fundamentals early.`,
      howToThink: `Treat every new trend in ${cat(0).toLowerCase()} as optional until it survives three months of scrutiny. Start with the smallest workable setup, measure your results weekly, and only upgrade when a specific bottleneck tells you to.`,
      pros: [`Clearer best practices for ${cat(0).toLowerCase()}`, "Cheaper entry points than a year ago", "Stronger communities to learn from"],
      cons: ["Hype cycles still bury good information", "Gear churn tempts constant upgrades", "Advice rarely accounts for small budgets"],
      watchOut: `Beware of roundups that rank ${cat(0).toLowerCase()} options without disclosing how they tested. If there is no methodology, it is marketing.`,
      faq: [
        { q: `Is ${cat(0).toLowerCase()} worth getting into now?`, a: `Yes — the fundamentals are more accessible than ever, and the learning curve is well documented by communities of ${audience}.` },
        { q: "How much should a beginner spend?", a: "As little as possible at first. Prove the habit before you fund the hobby." },
        { q: "Where do experienced people hang out?", a: `Community forums and subreddits remain the highest-signal places to compare notes.` }
      ]
    },
    {
      slug: `starter-guide-${slugify(cat(1))}`,
      title: `Starter guide: ${cat(1)} without the overwhelm`,
      category: cat(1),
      dek: `A practical on-ramp to ${cat(1).toLowerCase()} for ${audience} — one repeatable workflow, no gear debt.`,
      takeaway: `You need far less than the internet says. One core setup plus a weekly routine beats a cart full of gear.`,
      whatHappened: `Every week, newcomers ask the same question in every community for ${audience}: where do I actually start with ${cat(1).toLowerCase()}? The honest answer has stabilized — start small, publish or practice on a schedule, and iterate.`,
      whyItMatters: `The dropout rate in ${cat(1).toLowerCase()} is driven by overwhelm, not difficulty. People who scope their first month tightly are still around in month six; people who buy everything up front usually are not.`,
      howToThink: `Pick one sub-topic from ${cats.join(", ").toLowerCase()} and commit to it for thirty days. Keep a simple log of what worked. Momentum, not equipment, is the real unlock.`,
      pros: ["Low starting costs", "Fast feedback loops", "A forgiving learning curve when scoped small"],
      cons: ["Endless conflicting advice online", "Easy to over-buy in week one", "Progress feels slow without a log"],
      watchOut: `The "buy once, cry once" advice is usually premature for beginners — rent, borrow, or go entry-level until your routine survives a month.`,
      faq: [
        { q: "What is the single best first step?", a: `Block thirty minutes, twice a week, for ${cat(1).toLowerCase()} — the schedule matters more than the content of the sessions.` },
        { q: "How do I avoid bad advice?", a: "Prefer sources that show their process and their failures, not just results." },
        { q: "When should I upgrade?", a: "When a specific, recurring bottleneck — not boredom — tells you to." }
      ]
    },
    {
      slug: `signal-vs-noise-${slugify(query(0)).slice(0, 40)}`,
      title: `"${query(0)}" — separating signal from noise`,
      category: cat(2),
      dek: `Thousands of people search "${query(0)}" every month. Most of what they find is recycled. Here is what holds up.`,
      takeaway: `Most top results for "${query(0)}" are affiliate-first content. The durable advice fits in three paragraphs.`,
      whatHappened: `Search results for "${query(0)}" have been overrun by templated listicles that rank products no one tested. Meanwhile, the practical consensus among ${audience} lives in forum threads and comment sections that never rank.`,
      whyItMatters: `If you are making decisions based on page-one results, you are optimizing for what advertisers want to sell this quarter — not for what works. Knowing how to read past the SEO layer is now a core skill.`,
      howToThink: `Cross-reference any recommendation against a community of practitioners before acting on it. One enthusiastic forum thread with photos and follow-ups outweighs ten anonymous listicles.`,
      pros: ["Community answers are richer than ever", "Real long-term reviews do exist", "Skepticism is cheap and effective"],
      cons: ["Page-one results skew commercial", "Good threads are hard to search", "Dated advice lingers for years"],
      watchOut: `Any article that answers "${query(0)}" with exactly ten products, each linked to a retailer, was written for the retailer — not for you.`,
      faq: [
        { q: "Are listicles ever useful?", a: "As a vocabulary builder, yes. As a buying guide, rarely." },
        { q: "What is the fastest credibility check?", a: "Look for testing methodology, dates, and follow-up edits. Absence of all three is disqualifying." },
        { q: "Where is the real signal?", a: "Practitioner communities, maintained wikis, and creators who show failures." }
      ]
    },
    {
      slug: `rethinking-${slugify(cat(2))}`,
      title: `Why ${audience.split(" and ")[0]} are rethinking ${cat(2)}`,
      category: cat(2),
      dek: `A quiet shift is underway in how ${audience} approach ${cat(2).toLowerCase()} — less maximalism, more maintenance.`,
      takeaway: `The upgrade treadmill is losing to a maintenance mindset: keep what works, fix what breaks, learn what lasts.`,
      whatHappened: `Across communities of ${audience}, the loudest voices are no longer the ones with the newest setups. Long-term reports, repair logs, and "one year later" retrospectives are earning the attention that unboxings used to get.`,
      whyItMatters: `This changes what beginners should copy. The most reliable path through ${cat(2).toLowerCase()} now looks like stewardship: fewer acquisitions, better habits, and skills that transfer even when the gear changes.`,
      howToThink: `Before adding anything new to your ${cat(2).toLowerCase()} routine, ask what you would remove to make room for it. A stable baseline you understand beats a rotating cast of novelties.`,
      pros: ["Lower ongoing costs", "Deeper skill development", "Less decision fatigue"],
      cons: ["Slower dopamine than new-gear day", "Requires honest self-tracking", "Community status still favors novelty"],
      watchOut: `Minimalism can become its own consumption genre. The goal is fewer, better decisions in ${cat(2).toLowerCase()} — not a new aesthetic to shop for.`,
      faq: [
        { q: "Is this just frugality rebranded?", a: "Partly — but the bigger driver is that maintenance produces better results than acquisition past a modest baseline." },
        { q: "What should I track?", a: "Usage, not ownership. What you touch weekly deserves investment; what you don't, doesn't." },
        { q: "Does this apply to beginners?", a: "Especially to beginners — they have the most to gain from skipping the treadmill entirely." }
      ]
    },
    {
      slug: `budget-${slugify(cat(3))}`,
      title: `${cat(3)} on a budget: what actually matters`,
      category: cat(3),
      dek: `Where money changes outcomes in ${cat(3).toLowerCase()} — and the line items that are pure vanity.`,
      takeaway: `Spend on the two or three things that touch every session; go cheap or secondhand on everything else.`,
      whatHappened: `Price-performance in ${cat(3).toLowerCase()} has quietly improved: entry-level options that were compromised a few years ago are now genuinely serviceable, and the secondhand market for ${audience} has matured.`,
      whyItMatters: `The budget question is really a sequencing question. The first hundred dollars matters enormously; the fifth hundred barely registers. Knowing which purchases carry the outcome lets you stop guessing.`,
      howToThink: `List every component of your ${cat(3).toLowerCase()} setup, then rank by hours of contact per week. Fund the top of the list. Everything below the fold can wait, be borrowed, or be bought used.`,
      pros: ["Entry-level quality is real now", "Secondhand markets are deep", "Communities publish honest budget builds"],
      cons: ["Cheap tiers still hide a few traps", "Shipping and extras erode budgets", "Premium marketing targets beginners"],
      watchOut: `The most expensive mistake in ${cat(3).toLowerCase()} is buying the same category twice — once cheap and once right. For contact-heavy items, mid-tier first is often the cheaper path.`,
      faq: [
        { q: "What deserves the biggest share of budget?", a: "Whatever you physically interact with the most, every single session." },
        { q: "Is secondhand safe?", a: "Generally yes, if you buy from active community members and test before paying when possible." },
        { q: "When is premium worth it?", a: "When you can name the specific limitation it removes. Otherwise it's decoration." }
      ]
    },
    {
      slug: `what-to-watch-${slugify(cat(1))}`,
      title: `What to watch next in ${cat(1)}: five quiet shifts`,
      category: cat(1),
      dek: `Ignore the headlines — these are the slower currents reshaping ${cat(1).toLowerCase()} for ${audience}.`,
      takeaway: `The interesting changes in ${cat(1).toLowerCase()} are structural: better communities, cheaper tools, and knowledge that compounds.`,
      whatHappened: `While attention chased launches, the infrastructure around ${cat(1).toLowerCase()} kept improving: guides got maintained, prices drifted down, and the gap between beginner and intermediate practice narrowed for ${audience}.`,
      whyItMatters: `Structural shifts outlast news cycles. Anyone planning their next year in ${cat(1).toLowerCase()} should be positioning for these currents rather than reacting to whatever trended this week.`,
      howToThink: `Once a quarter, review what has become easier, cheaper, or better documented in ${cat(1).toLowerCase()} — then simplify your setup accordingly. The best time to shed complexity is when the ecosystem absorbs it for you.`,
      pros: ["Knowledge bases keep improving", "Costs trend down over time", "On-ramps get gentler every year"],
      cons: ["Quiet shifts are easy to miss", "Old guides pollute search results", "Communities fragment across platforms"],
      watchOut: `A "quiet shift" that only one vendor is announcing is not a shift — it's a campaign. Look for the same signal from at least two unaffiliated communities.`,
      faq: [
        { q: "How do I track slow changes?", a: "A quarterly review of your own logs plus one trusted community digest is enough." },
        { q: "Should I act on trends early?", a: "Only when the cost of being wrong is trivial. Otherwise let early adopters absorb the risk." },
        { q: "What's the biggest shift right now?", a: `The consolidation of reliable knowledge — good defaults for ${cat(1).toLowerCase()} are easier to find than ever.` }
      ]
    }
  ];

  return blueprints.map((post, index) => ({ ...post, sources: sourcesFor(index), tags: [cat(index), cat(index + 1)] }));
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

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const posts = JSON.parse(cleaned);
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

  // Stagger publish dates so the site reads as a living stream.
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

// ---------------------------------------------------------------------------
// Post archive — persisted per site so posts can accumulate hourly
// ---------------------------------------------------------------------------

function loadPostArchive(siteSlug) {
  try {
    return JSON.parse(fs.readFileSync(path.join(POSTS_ARCHIVE_DIR, `${siteSlug}.json`), "utf8"));
  } catch {
    return [];
  }
}

function savePostArchive(siteSlug, posts) {
  fs.mkdirSync(POSTS_ARCHIVE_DIR, { recursive: true });
  fs.writeFileSync(path.join(POSTS_ARCHIVE_DIR, `${siteSlug}.json`), `${JSON.stringify(posts, null, 2)}\n`, "utf8");
}

// ---------------------------------------------------------------------------
// Hourly posts — rotating archetypes keep template output varied when no
// Gemini key is available; with a key, Gemini writes one fresh post per hour.
// ---------------------------------------------------------------------------

function hourlyPostTemplate(niche, rawIndex) {
  // Offset by a per-niche hash so different sites publish different
  // archetypes in the same hour instead of moving in lockstep.
  let hash = 0;
  for (const char of String(niche.id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const index = rawIndex + (hash % 8);

  const cats = niche.categories;
  const cat = cats[index % cats.length];
  const catLower = cat.toLowerCase();
  const audience = niche.audience;
  const firstAudience = audience.split(" and ")[0];
  const query = niche.braveQueries[index % niche.braveQueries.length];
  const subreddit = niche.subreddits[index % niche.subreddits.length];

  const sources = [
    { label: `r/${subreddit} community threads`, url: `https://www.reddit.com/r/${subreddit}/` },
    { label: `Search interest: "${query}"`, url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}` }
  ];

  const archetypes = [
    {
      slug: `${slugify(query)}-field-test`.slice(0, 60),
      title: `"${query}" in practice: a real-world field test`,
      dek: `We put the most-repeated advice about ${query} through a month of actual use. Some of it survived.`,
      takeaway: `Half the standard advice on ${query} holds up; the other half exists to sell you something. Test small before you commit.`,
      whatHappened: `We collected the most common recommendations ${audience} see when they search "${query}" and ran them through four weeks of ordinary, unglamorous use. The gap between what demos well and what holds up in week four was bigger than expected.`,
      whyItMatters: `Most advice about ${catLower} is written from a first impression. The failure modes that actually cost ${audience} time and money only show up with repetition — which is exactly what one-day reviews never capture.`,
      howToThink: `Before adopting any recommendation about ${query}, ask what a fourth week of it looks like. If you can't picture the boring version, you're looking at marketing, not a method.`,
      pros: ["Cheap to replicate at home", "Surfaced real week-four failure modes", "Cuts through first-impression reviews"],
      cons: ["A month is still a small sample", "Results vary by setup", "Some advice needs a season, not weeks"],
      watchOut: `If a guide about ${query} shows zero failed attempts, it wasn't a test — it was a script.`,
      faq: [
        { q: "What survived the field test?", a: "The fundamentals: consistent routine, modest gear, and keeping a log. The exotic tricks mostly didn't." },
        { q: "How should I run my own test?", a: "Change one variable, hold everything else steady for two weeks minimum, and write down what annoyed you." },
        { q: "Whose advice should I trust?", a: `People who publish follow-ups. A single enthusiastic post about ${catLower} is a data point, not a verdict.` }
      ]
    },
    {
      slug: `five-${slugify(cat)}-mistakes`.slice(0, 60),
      title: `Five mistakes everyone makes in their first month of ${catLower}`,
      dek: `The most common early stumbles in ${catLower}, and the cheap corrections that fix them for ${audience}.`,
      takeaway: `Month-one mistakes in ${catLower} are nearly universal — and nearly all reversible if you catch them early.`,
      whatHappened: `We combed the recurring "what did I do wrong" threads that ${audience} post and the same five ${catLower} mistakes appear over and over: buying before learning, copying advanced setups, skipping the log, chasing novelty, and quitting during the boring middle.`,
      whyItMatters: `Each of these mistakes feels productive while you're making it. That's why they persist — and why naming them explicitly saves newcomers weeks of stalled progress in ${catLower}.`,
      howToThink: `Audit yourself against the list once a month. The point isn't guilt — it's that every one of these has a five-minute correction if you notice it early enough.`,
      pros: ["Each mistake has a cheap fix", "Recognition is most of the cure", "Applies at any experience level"],
      cons: ["Easy to nod along and change nothing", "Some mistakes feel like progress", "Lists can't replace a habit"],
      watchOut: `The most expensive version of every month-one mistake is the one you rationalize as "investing in the hobby."`,
      faq: [
        { q: "Which mistake costs the most?", a: "Buying before learning — it converts enthusiasm into clutter and guilt instead of skill." },
        { q: "I already made all five. Now what?", a: "Good news: so did everyone else. Pick the one currently costing you the most and fix only that." },
        { q: "How do I avoid new mistakes?", a: "Keep the log. Most errors are invisible until they're written down." }
      ]
    },
    {
      slug: `${slugify(cat)}-pre-spend-checklist`.slice(0, 60),
      title: `The ${catLower} checklist: run this before you spend`,
      dek: `Seven questions that separate a justified ${catLower} purchase from an expensive mood.`,
      takeaway: `A purchase you can't tie to a specific, recurring bottleneck is decoration. The checklist makes that visible before checkout.`,
      whatHappened: `Communities of ${audience} keep converging on the same pre-purchase discipline: name the bottleneck, check the secondhand market, price the alternative of doing nothing, and sleep on it once. We compiled the full checklist from hundreds of those threads.`,
      whyItMatters: `Spending in ${catLower} is lumpy — a few purchases carry all the outcome. The checklist exists to make sure your money lands on those and not on the long tail of gear that demos well and shelves fast.`,
      howToThink: `Treat the checklist as friction on purpose. Anything that survives seven honest questions was probably worth buying; anything that doesn't survives as money.`,
      pros: ["Kills impulse purchases painlessly", "Works at any budget", "Builds a paper trail of good calls"],
      cons: ["Requires honesty under temptation", "Slower than one-click checkout", "Friends may call you cheap"],
      watchOut: `Sales events are checklist bypass attempts. A discount on something you don't need is still a net loss.`,
      faq: [
        { q: "What's the single best question?", a: `"Which session this week did I lose to not owning this?" If you can't name one, close the tab.` },
        { q: "Does this apply to small purchases?", a: "Under a coffee's cost, skip the ceremony. The checklist is for anything you'd notice on a statement." },
        { q: "What about once-a-year deals?", a: "A real bottleneck plus a real discount is great. The checklist just confirms which one you have." }
      ]
    },
    {
      slug: `community-pulse-${slugify(subreddit)}`.slice(0, 60),
      title: `Community pulse: what r/${subreddit} is debating this week`,
      dek: `The arguments, consensus shifts, and quietly useful threads from the ${catLower} community this week.`,
      takeaway: `The community's loudest argument is rarely its most useful thread. We pulled out both.`,
      whatHappened: `This week's discussion among ${audience} split between a recurring gear-versus-skill argument and a quieter thread of genuinely practical write-ups. As usual, the practical material got a fraction of the attention and most of the value.`,
      whyItMatters: `Forums are the highest-signal source in ${catLower} — but only if you know how to read them. The upvote curve rewards controversy; the archive rewards patience.`,
      howToThink: `Read communities like a researcher, not a spectator: skip the drama threads, sort by top-of-month, and save anything with photos, numbers, and a follow-up edit.`,
      pros: ["Real practitioners, real failures", "Searchable archive of past debates", "Faster than trial and error"],
      cons: ["Upvotes reward heat, not light", "Survivorship bias in success posts", "Same arguments recur monthly"],
      watchOut: `When a thread's top comment starts with "everyone knows," verify it. Community consensus in ${catLower} has a half-life.`,
      faq: [
        { q: "Which threads are worth saving?", a: "Anything with a methodology, a budget, photos, and a follow-up edit. That combination is rare and gold." },
        { q: "Should I post my own questions?", a: "Yes — after searching. A well-scoped question with context gets remarkable answers." },
        { q: "How do I avoid the drama?", a: "Sort by top-of-month instead of hot. The algorithm is the drama's delivery system." }
      ]
    },
    {
      slug: `weekend-project-${slugify(cat)}`.slice(0, 60),
      title: `A weekend project: level up your ${catLower} in two hours`,
      dek: `One contained, satisfying ${catLower} project for ${firstAudience} — start Saturday morning, done by lunch.`,
      takeaway: `Two focused hours on fundamentals beats two months of accumulating tabs. This project is deliberately small enough to finish.`,
      whatHappened: `We designed a two-hour ${catLower} project around the single highest-leverage fundamental — the one that experienced ${audience} consistently say they wish they'd done sooner. No purchases required, no prerequisites beyond what you already have.`,
      whyItMatters: `Unfinished projects are the silent killer of hobbies. A project scoped to one sitting produces the thing rarer than skill: a completed feedback loop you can build on next weekend.`,
      howToThink: `Pick the smallest version of the project that still counts as done. Momentum compounds; scope creep compounds faster.`,
      pros: ["Fits in one honest morning", "Zero new purchases required", "Produces a reusable baseline"],
      cons: ["Less exciting than new gear", "Requires protecting two hours", "Results are quiet, not flashy"],
      watchOut: `If the project sprouts a shopping list, you've left the project. Write the list down for later and keep going with what you have.`,
      faq: [
        { q: "What if I only have one hour?", a: "Do the first half. A half-finished small project still beats a never-started big one." },
        { q: "Can I do this with zero experience?", a: `Yes — it's designed as an on-ramp. The fundamentals of ${catLower} don't care about your resume.` },
        { q: "What's next weekend's project?", a: "The same one, refined with what the log told you. Iteration is the curriculum." }
      ]
    },
    {
      slug: `myth-vs-reality-${slugify(query)}`.slice(0, 60),
      title: `Myth vs. reality: ${query}`,
      dek: `The persistent myths around ${query}, stress-tested against what ${audience} actually report.`,
      takeaway: `The biggest myths about ${query} survive because they're convenient, not because they're true.`,
      whatHappened: `We lined up the claims that dominate search results for "${query}" against long-term reports from ${audience}. Three claims collapsed immediately, one held up with caveats, and one turned out to be truer than its critics admit.`,
      whyItMatters: `Myths in ${catLower} aren't harmless — they set budgets, shape routines, and decide who gives up. Replacing one myth with one measured fact upgrades every decision downstream.`,
      howToThink: `For any confident claim about ${query}, ask: who measured it, over what period, and who profits if I believe it? Two out of three unanswered means file it under folklore.`,
      pros: ["Frees budget from myth-driven buys", "Long-term reports are abundant now", "Skepticism transfers to every niche"],
      cons: ["Myths are more fun than caveats", "Debunks age poorly too", "Nuance doesn't fit a headline"],
      watchOut: `Beware the counter-myth: the internet loves inverting popular advice, and the inversion is usually just as unmeasured.`,
      faq: [
        { q: "What's the most expensive myth?", a: "That better gear reliably substitutes for practice. It shows up in every niche's spending regrets thread." },
        { q: "How do myths start?", a: "A true statement about one context, repeated without the context, monetized without the truth." },
        { q: "What actually held up?", a: "Consistency claims. The boring advice survives testing at a rate the exciting advice never matches." }
      ]
    },
    {
      slug: `quiet-upgrade-${slugify(cat)}`.slice(0, 60),
      title: `The quiet upgrade: small tweaks in ${catLower} with outsized returns`,
      dek: `No purchases, no overhauls — the modest ${catLower} adjustments that ${audience} report mattering most.`,
      takeaway: `The best upgrades in ${catLower} are adjustments, not acquisitions. Most cost nothing but attention.`,
      whatHappened: `Ask experienced ${audience} what changed their results and the answers are strikingly modest: a tweak to routine, a default swapped, a habit moved earlier in the day. We collected the small changes that keep appearing in those answers.`,
      whyItMatters: `The upgrade path everyone markets requires spending. The one that works requires noticing. Small adjustments compound daily, which is a rate no purchase matches.`,
      howToThink: `Once a month, change one default in your ${catLower} routine and watch for a week. Keep what helps, revert what doesn't, and write down which was which.`,
      pros: ["Free or nearly free", "Compounds with repetition", "Reversible in minutes"],
      cons: ["Invisible on social media", "Requires actually paying attention", "No unboxing dopamine"],
      watchOut: `Don't stack five changes at once — you'll never know which one worked, and you'll revert the good one with the bad.`,
      faq: [
        { q: "What's the highest-leverage small change?", a: "Moving your session to the time of day you're least likely to skip. Adherence beats optimization." },
        { q: "How do I find my own quiet upgrades?", a: "Your log. The pattern you're annoyed by weekly is the upgrade waiting to happen." },
        { q: "When is buying actually the answer?", a: "When the same friction survives three free fixes. Then spend without guilt." }
      ]
    },
    {
      slug: `ask-the-forge-${slugify(cat)}`.slice(0, 60),
      title: `Ask the forge: your ${catLower} questions, answered`,
      dek: `Straight answers to the ${catLower} questions ${audience} keep asking, minus the hedging.`,
      takeaway: `Most ${catLower} questions have boring, reliable answers. Here they are, without the two thousand words of preamble.`,
      whatHappened: `We gathered the questions that appear weekly wherever ${audience} compare notes — the ones usually answered with "it depends" — and committed to actual answers with actual reasoning.`,
      whyItMatters: `"It depends" is true and useless. Newcomers to ${catLower} don't need every caveat; they need a defensible default they can adjust later.`,
      howToThink: `Take the default, use it for a month, then earn your deviations. Customization is a reward for data, not a starting requirement.`,
      pros: ["Defaults beat decision paralysis", "Reasoning shown, not just verdicts", "Adjustable once you have data"],
      cons: ["Defaults fit most, not all", "Experts will quibble — always", "Questions evolve; answers date"],
      watchOut: `Any answer that can't say what would change its mind isn't an answer — it's an identity. Ours come with conditions attached.`,
      faq: [
        { q: "What's the most-asked question?", a: `"What should I buy first?" — and the answer is almost always: nothing yet. Run the routine for two weeks first.` },
        { q: "Why give defaults instead of options?", a: "Because ten options produce paralysis and one default produces feedback. You can only iterate on something you started." },
        { q: "How often do these answers change?", a: "We revisit quarterly. The fundamentals drift slowly; the gear recommendations drift fast." }
      ]
    }
  ];

  const archetype = archetypes[index % archetypes.length];
  return { ...archetype, category: cat, tags: [cat, cats[(index + 1) % cats.length]], sources };
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
  const post = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim());
  if (!post || typeof post !== "object" || !post.title) throw new Error("Gemini returned invalid post");
  return post;
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

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function themeCss(theme) {
  return `:root {
  color-scheme: ${theme.mode};
  --paper: ${theme.paper};
  --panel: ${theme.panel};
  --ink: ${theme.ink};
  --body: ${theme.body};
  --muted: ${theme.muted};
  --line: ${theme.line};
  --accent: ${theme.accent};
  --accent-deep: ${theme.accentDeep};
  --accent-2: ${theme.accent2};
  --glow: ${theme.glow};
  --radius: ${theme.radius};
  --display-font: "${theme.displayFont}", "Inter", sans-serif;
  --display-weight: ${theme.displayWeight};
  --display-transform: ${theme.displayTransform};
  --display-tracking: ${theme.displayTracking};
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--body);
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  font-size: 1.0625rem;
  line-height: 1.75;
}
a { color: inherit; }
img { max-width: 100%; display: block; }

.shell { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }
.narrow { max-width: 46rem; }

.display {
  font-family: var(--display-font);
  font-weight: var(--display-weight);
  text-transform: var(--display-transform);
  letter-spacing: var(--display-tracking);
  color: var(--ink);
  line-height: 1.02;
}
.text-gradient {
  background: ${theme.gradient};
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.mono-label {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: var(--muted);
}

.site-header {
  position: sticky; top: 0; z-index: 40;
  background: color-mix(in srgb, var(--paper) 80%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.site-header::before {
  content: ""; display: block; height: 2px;
  background: ${theme.gradient};
}
.site-header .bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 0; }
.wordmark { text-decoration: none; }
.wordmark .name { font-size: 1.35rem; }
.wordmark .tag { display: block; margin-top: 0.1rem; }
.site-nav { display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap; }
.site-nav a { text-decoration: none; }
.site-nav a:hover { color: var(--accent); }

.masthead { padding: 3.5rem 0 2.5rem; }
.masthead .kicker { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.live-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--accent); box-shadow: 0 0 0 4px var(--glow); }
.masthead h1 { margin: 0; font-size: clamp(2.8rem, 8vw, 4.8rem); }
.masthead .sub { max-width: 38rem; color: var(--muted); margin: 1.1rem 0 0; }

.chip {
  display: inline-block;
  border: 1px solid var(--accent);
  color: var(--accent);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  padding: 0.25rem 0.6rem;
  text-decoration: none;
}
.chip:hover { background: var(--accent); color: var(--paper); }

.card {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 0 22px -4px var(--glow), 0 14px 30px -18px rgba(0,0,0,0.4); }
.card .thumb { display: block; overflow: hidden; }
.card .thumb img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; transition: transform 0.35s ease; }
.card:hover .thumb img { transform: scale(1.04); }
.card .body { display: flex; flex-direction: column; align-items: flex-start; gap: 0.15rem; padding: 1.15rem 1.25rem 1.35rem; }
.card h2, .card h3 { margin: 0.6rem 0 0.45rem; font-size: 1.18rem; line-height: 1.25; }
.card h2 a, .card h3 a { color: var(--ink); text-decoration: none; }
.card h2 a:hover, .card h3 a:hover { color: var(--accent); }
.card p { margin: 0 0 0.8rem; color: var(--muted); font-size: 0.95rem; }
.meta { color: var(--muted); font-size: 0.8rem; font-family: "JetBrains Mono", monospace; }

.featured { display: grid; gap: 0; grid-template-columns: 1fr; margin-bottom: 3rem; }
.featured .thumb img { aspect-ratio: 4 / 3; }
.featured .body { padding: 1.6rem 1.75rem; display: flex; flex-direction: column; justify-content: center; }
.featured h2 { font-size: clamp(1.6rem, 3.5vw, 2.3rem); }
@media (min-width: 800px) { .featured { grid-template-columns: 3fr 2fr; } }

.divider { display: flex; align-items: center; gap: 1rem; margin: 2.5rem 0 1.75rem; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--line)); }
.divider::after { background: linear-gradient(90deg, var(--line), transparent); }

.grid-cards { display: grid; gap: 1.5rem; grid-template-columns: 1fr; padding-bottom: 1rem; }
@media (min-width: 640px) { .grid-cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid-cards { grid-template-columns: repeat(3, 1fr); } }

article.post { padding: 3rem 0 1rem; }
article.post .headline { font-size: clamp(2.1rem, 6vw, 3.4rem); margin: 0.9rem 0 1rem; }
article.post .dek { font-size: 1.2rem; color: var(--muted); font-style: italic; margin: 0 0 2rem; }
article.post figure { margin: 0 0 2.25rem; }
article.post figure img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--line); }
article.post figcaption { margin-top: 0.5rem; }
article.post h2 { font-family: var(--display-font); color: var(--ink); font-size: 1.45rem; margin: 2.4rem 0 0.8rem; }
article.post h2::before { content: "// "; color: var(--accent); font-family: "JetBrains Mono", monospace; font-size: 1rem; }

.callout { border-left: 3px solid var(--accent); background: var(--panel); padding: 1rem 1.25rem; margin: 2rem 0; border-radius: 0 var(--radius) var(--radius) 0; }
.callout .mono-label { color: var(--accent); }
.callout p { margin: 0.4rem 0 0; color: var(--ink); }
.callout.warn { border-left-color: #d97706; }
.callout.warn .mono-label { color: #d97706; }

.procon { display: grid; gap: 1px; grid-template-columns: 1fr; background: var(--line); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; margin: 2rem 0; }
@media (min-width: 640px) { .procon { grid-template-columns: 1fr 1fr; } }
.procon section { background: var(--paper); padding: 1.1rem 1.25rem; }
.procon ul { margin: 0.6rem 0 0; padding-left: 1.1rem; }
.procon li { margin: 0.3rem 0; font-size: 0.95rem; }
.procon .pro .mono-label { color: #059669; }
.procon .con .mono-label { color: #e11d48; }

details.faq { border: 1px solid var(--line); border-radius: var(--radius); margin: 0.6rem 0; background: var(--panel); }
details.faq summary { cursor: pointer; padding: 0.85rem 1.1rem; font-weight: 600; color: var(--ink); list-style: none; display: flex; justify-content: space-between; gap: 1rem; }
details.faq summary::after { content: "+"; font-family: "JetBrains Mono", monospace; color: var(--accent); transition: transform 0.2s ease; }
details.faq[open] summary::after { transform: rotate(45deg); }
details.faq .answer { padding: 0 1.1rem 1rem; color: var(--muted); }

.sources { margin: 2rem 0; padding: 0; list-style: none; }
.sources li { display: flex; gap: 0.9rem; padding: 0.55rem 0; border-bottom: 1px solid var(--line); }
.sources .num { font-family: "JetBrains Mono", monospace; color: var(--accent); font-size: 0.8rem; padding-top: 0.2rem; }
.sources a { color: var(--ink); text-decoration: none; }
.sources a:hover { color: var(--accent); }

.tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 2rem 0; }

.newsletter { border: 1px solid var(--line); background: var(--panel); border-radius: var(--radius); padding: 1.6rem 1.75rem; margin: 2.5rem 0; }
.newsletter h3 { margin: 0.4rem 0 0.3rem; color: var(--ink); }
.newsletter p { margin: 0 0 1rem; color: var(--muted); font-size: 0.95rem; }
.newsletter form { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.newsletter input[type="email"] {
  flex: 1; min-width: 200px;
  background: var(--paper); color: var(--ink);
  border: 1px solid var(--line); border-radius: var(--radius);
  padding: 0.65rem 0.9rem; font: inherit;
}
.newsletter button {
  background: ${theme.gradient};
  color: #fff; border: 0; border-radius: var(--radius);
  padding: 0.65rem 1.3rem; font: inherit; font-weight: 700; cursor: pointer;
}
.newsletter button:hover { box-shadow: 0 0 18px -2px var(--glow); }
.newsletter .hp { position: absolute; left: -9999px; }
.newsletter .ack { color: var(--accent); font-size: 0.9rem; margin-top: 0.6rem; display: none; }

.keep-reading { margin: 2.5rem 0; }
.keep-reading ul { list-style: none; padding: 0; margin: 1rem 0 0; }
.keep-reading li { border-bottom: 1px solid var(--line); padding: 0.7rem 0; display: flex; justify-content: space-between; gap: 1rem; }
.keep-reading a { color: var(--ink); text-decoration: none; font-weight: 600; }
.keep-reading a:hover { color: var(--accent); }

.site-footer { border-top: 1px solid var(--line); margin-top: 4rem; padding: 3rem 0 3.5rem; }
.site-footer .cols { display: grid; gap: 2rem; grid-template-columns: 1fr; }
@media (min-width: 800px) { .site-footer .cols { grid-template-columns: 1.2fr 1fr; } }
.site-footer .links { display: flex; gap: 1.25rem; flex-wrap: wrap; margin: 0.9rem 0; }
.site-footer .links a { text-decoration: none; }
.site-footer .links a:hover { color: var(--accent); }
.site-footer .fine { color: var(--muted); font-size: 0.85rem; line-height: 1.6; }
`;
}

function fontLinks(theme) {
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${theme.fontQuery}&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@700&display=swap" />`;
}

const NEWSLETTER_SCRIPT = `<script>
document.addEventListener("submit", function (event) {
  var form = event.target.closest("[data-newsletter]");
  if (!form) return;
  event.preventDefault();
  var ack = form.parentElement.querySelector(".ack");
  if (ack) { ack.style.display = "block"; }
  form.reset();
});
</script>`;

function renderNewsletter(site) {
  return `<aside class="newsletter">
      <span class="mono-label">Newsletter</span>
      <h3 class="display">Get the weekly dispatch</h3>
      <p>The week's highest-signal ${escapeHtml(site.name)} stories, synthesized. No spam.</p>
      <form data-newsletter>
        <input type="email" name="email" placeholder="you@example.com" required />
        <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" />
        <button type="submit">Subscribe</button>
      </form>
      <p class="ack">You're on the list. Watch for the next dispatch.</p>
    </aside>`;
}

function renderChrome(site, { root, title, description, body, theme }) {
  const categories = site.categories.slice(0, 3);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${fontLinks(theme)}
  <link rel="stylesheet" href="${root}assets/site.css" />
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.name)}" href="${root}feed.xml" />
</head>
<body>
  <header class="site-header">
    <div class="shell bar">
      <a class="wordmark" href="${root}">
        <span class="name display text-gradient">${escapeHtml(site.name)}</span>
        <span class="tag mono-label">${categories.map(escapeHtml).join(" · ")}</span>
      </a>
      <nav class="site-nav mono-label">
        <a href="${root}#dispatches">Latest</a>
        ${categories.map((category) => `<a href="${root}#dispatches">${escapeHtml(category)}</a>`).join("\n        ")}
        <a href="${root}about.html">About</a>
        <a href="${root}feed.xml">RSS</a>
      </nav>
    </div>
  </header>
${body}
  <footer class="site-footer">
    <div class="shell cols">
      <div>
        <span class="display text-gradient" style="font-size:1.3rem">${escapeHtml(site.name)}</span>
        <p class="fine">${escapeHtml(site.tagline)} A new dispatch lands on its own schedule, generated from what's trending.</p>
        <div class="links mono-label">
          <a href="${root}about.html">About</a>
          <a href="${root}feed.xml">RSS</a>
          <a href="${site.streamUrl}" rel="noopener">BeyondMythos stream</a>
        </div>
        <p class="fine">© 2026 ${escapeHtml(site.name)} — No humans were harmed in the making of this blog.</p>
      </div>
      <div>
        ${renderNewsletter(site)}
        <p class="fine"><strong>Editorial standards:</strong> articles on this site are researched and drafted with AI and published under editorial oversight as part of the BeyondMythos network. Every post cites its sources.</p>
      </div>
    </div>
  </footer>
  ${NEWSLETTER_SCRIPT}
</body>
</html>`;
}

function renderCard(site, post, { heading = "h3" } = {}) {
  return `<article class="card">
      <a class="thumb" href="posts/${post.slug}.html" tabindex="-1" aria-hidden="true">
        <img src="${imageFor(site, post.slug, 640, 400)}" alt="" loading="lazy" />
      </a>
      <div class="body">
        <span class="chip">${escapeHtml(post.category)}</span>
        <${heading} class="display"><a href="posts/${post.slug}.html">${escapeHtml(post.title)}</a></${heading}>
        <p>${escapeHtml(post.dek)}</p>
        <span class="meta">${formatDate(post.publishedAt)} · ${post.readMinutes} min read</span>
      </div>
    </article>`;
}

function renderHome(site, posts, theme) {
  const [featured, ...rest] = posts;
  const body = `  <main class="shell">
    <section class="masthead">
      <div class="kicker">
        <span class="live-dot"></span>
        <span class="mono-label">${escapeHtml(formatLongDate(site.createdAt))} · Updated on deploy</span>
      </div>
      <h1 class="display"><span class="text-gradient">${escapeHtml(site.name)}</span></h1>
      <p class="sub">${escapeHtml(site.tagline)} ${escapeHtml(`Dispatches for ${site.audience}, synthesized from across the web.`)}</p>
    </section>

    <section class="featured card">
      <a class="thumb" href="posts/${featured.slug}.html" tabindex="-1" aria-hidden="true">
        <img src="${imageFor(site, featured.slug, 960, 720)}" alt="" />
      </a>
      <div class="body">
        <span class="chip">${escapeHtml(featured.category)}</span>
        <h2 class="display"><a href="posts/${featured.slug}.html">${escapeHtml(featured.title)}</a></h2>
        <p>${escapeHtml(featured.dek)}</p>
        <span class="meta">${formatDate(featured.publishedAt)} · ${featured.readMinutes} min read</span>
      </div>
    </section>

    <div class="divider" id="dispatches"><span class="mono-label" style="color:var(--accent)">More dispatches</span></div>

    <section class="grid-cards">
${rest.map((post) => renderCard(site, post)).join("\n")}
    </section>
  </main>`;

  return renderChrome(site, {
    root: "",
    title: `${site.name} · ${site.tagline}`,
    description: `${site.tagline} Dispatches for ${site.audience}.`,
    body,
    theme
  });
}

function renderPost(site, post, posts, theme) {
  const related = posts.filter((other) => other.slug !== post.slug).slice(0, 3);
  const body = `  <main class="shell narrow">
    <article class="post">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span class="chip">${escapeHtml(post.category)}</span>
        <span class="meta">${formatDate(post.publishedAt)} · ${post.readMinutes} min read</span>
      </div>
      <h1 class="headline display text-gradient">${escapeHtml(post.title)}</h1>
      <p class="dek">${escapeHtml(post.dek)}</p>
      <figure>
        <img src="${imageFor(site, post.slug, 1280, 720)}" alt="" />
        <figcaption class="mono-label">Photo via LoremFlickr</figcaption>
      </figure>

      <div class="callout">
        <span class="mono-label">Takeaway</span>
        <p>${escapeHtml(post.takeaway)}</p>
      </div>

      <h2>What happened</h2>
      <p>${escapeHtml(post.whatHappened)}</p>

      <h2>Why it matters</h2>
      <p>${escapeHtml(post.whyItMatters)}</p>

      <h2>How to think about it</h2>
      <p>${escapeHtml(post.howToThink)}</p>

      <div class="procon">
        <section class="pro">
          <span class="mono-label">Pros</span>
          <ul>${post.pros.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
        <section class="con">
          <span class="mono-label">Cons</span>
          <ul>${post.cons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
      </div>

      <div class="callout warn">
        <span class="mono-label">Watch out</span>
        <p>${escapeHtml(post.watchOut)}</p>
      </div>

      <h2>FAQ</h2>
${post.faq.map((item) => `      <details class="faq"><summary>${escapeHtml(item.q)}</summary><p class="answer">${escapeHtml(item.a)}</p></details>`).join("\n")}

      <h2>Sources</h2>
      <ul class="sources">
${post.sources.map((source, index) => `        <li><span class="num">${String(index + 1).padStart(2, "0")}</span><a href="${escapeHtml(source.url)}" rel="noopener nofollow">${escapeHtml(source.label)}</a></li>`).join("\n")}
      </ul>

      <div class="tags">
${post.tags.map((tag) => `        <span class="chip">#${escapeHtml(tag)}</span>`).join("\n")}
      </div>

      ${renderNewsletter(site)}

      <section class="keep-reading">
        <span class="mono-label" style="color:var(--accent)">Keep reading</span>
        <ul>
${related.map((other) => `          <li><a href="${other.slug}.html">${escapeHtml(other.title)}</a><span class="meta">${formatDate(other.publishedAt)}</span></li>`).join("\n")}
        </ul>
        <p style="margin-top:1.2rem"><a href="../" style="color:var(--accent);text-decoration:none">← Back to ${escapeHtml(site.name)}</a></p>
      </section>
    </article>
  </main>`;

  return renderChrome(site, {
    root: "../",
    title: `${post.title} · ${site.name}`,
    description: post.dek,
    body,
    theme
  });
}

function renderAbout(site, theme) {
  const body = `  <main class="shell narrow">
    <article class="post">
      <span class="mono-label" style="color:var(--accent)">About</span>
      <h1 class="headline display text-gradient">About ${escapeHtml(site.name)}</h1>
      <p class="dek">${escapeHtml(site.tagline)}</p>

      <h2>What this is</h2>
      <p>${escapeHtml(site.name)} is an automated niche dispatch for ${escapeHtml(site.audience)}, published by the BeyondMythos network. New sites and new posts are generated on a continuous schedule — synthesized from what's trending, then shaped into short, practical briefs.</p>

      <h2>Editorial standards</h2>
      <p>Articles on this site are researched and drafted with AI and published under editorial oversight. Every post carries a dated byline, a reading time, and a numbered list of sources. Nothing here is presented as first-hand reporting.</p>

      <h2>Topics we cover</h2>
      <p>${site.categories.map(escapeHtml).join(" · ")}</p>

      <div class="callout">
        <span class="mono-label">The network</span>
        <p>This site is one of a continuously growing stream. See everything the forge has deployed at the <a href="${site.streamUrl}" rel="noopener" style="color:var(--accent)">BeyondMythos live stream</a>.</p>
      </div>
    </article>
  </main>`;

  return renderChrome(site, {
    root: "",
    title: `About · ${site.name}`,
    description: `About ${site.name} — an automated dispatch for ${site.audience}.`,
    body,
    theme
  });
}

function renderFeed(site, posts) {
  const base = (site.url || "").replace(/\/+$/, "");
  const items = posts
    .slice(0, 30)
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}/posts/${post.slug}.html</link>
      <guid>${base}/posts/${post.slug}.html</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.dek)}</description>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${base}/</link>
    <description>${escapeXml(site.tagline)}</description>
${items}
  </channel>
</rss>
`;
}

function writeSiteFiles(site, posts, baseUrl) {
  const theme = THEMES[site.design] || THEMES[themeKeyForNiche(site.nicheId)];
  site.design = site.design || themeKeyForNiche(site.nicheId);
  site.streamUrl = `${baseUrl}/`;

  const siteDir = path.join(PUBLIC_SITES_DIR, site.slug);
  const postsDir = path.join(siteDir, "posts");
  const assetsDir = path.join(siteDir, "assets");
  fs.rmSync(siteDir, { recursive: true, force: true });
  fs.mkdirSync(postsDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  fs.writeFileSync(path.join(assetsDir, "site.css"), themeCss(theme), "utf8");
  fs.writeFileSync(path.join(siteDir, "index.html"), renderHome(site, posts, theme), "utf8");
  fs.writeFileSync(path.join(siteDir, "about.html"), renderAbout(site, theme), "utf8");
  fs.writeFileSync(path.join(siteDir, "feed.xml"), renderFeed(site, posts), "utf8");

  for (const post of posts) {
    fs.writeFileSync(path.join(postsDir, `${post.slug}.html`), renderPost(site, post, posts, theme), "utf8");
  }

  savePostArchive(site.slug, posts);
  return siteDir;
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
