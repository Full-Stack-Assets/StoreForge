const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(__dirname, "..", "data", "blog-sites.json");

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

function listSites() {
  const registry = loadRegistry();
  return [...registry.sites].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function registerSite(site) {
  const registry = loadRegistry();
  registry.sites.push(site);
  registry.lastGeneratedAt = site.createdAt;
  saveRegistry(registry);
  return site;
}

function slugExists(slug) {
  const registry = loadRegistry();
  return registry.sites.some((site) => site.slug === slug);
}

function getUsedNicheIds() {
  const registry = loadRegistry();
  return new Set(registry.sites.map((site) => site.nicheId));
}

module.exports = {
  loadRegistry,
  saveRegistry,
  listSites,
  registerSite,
  slugExists,
  getUsedNicheIds,
  REGISTRY_PATH
};
