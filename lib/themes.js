// Theme presets modeled on reference dispatch sites
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

module.exports = { THEMES, themeKeyForNiche };
