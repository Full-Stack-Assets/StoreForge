const fs = require("fs");
const path = require("path");

const NICHES_PATH = path.join(__dirname, "..", "data", "niches.json");

function loadNiches() {
  return JSON.parse(fs.readFileSync(NICHES_PATH, "utf8"));
}

function pickNiche(usedNicheIds) {
  const niches = loadNiches();
  const unused = niches.filter((niche) => !usedNicheIds.has(niche.id));
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

module.exports = { loadNiches, pickNiche, NICHES_PATH };
