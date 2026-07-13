/** Shared BeyondMythos configuration with backward-compatible env aliases. */

const DEFAULT_BASE_URL = "https://www.beyondmythos.com";

function getBaseUrl() {
  const configured = (
    process.env.BEYONDMYTHOS_URL ||
    process.env.STOREFORGE_URL ||
    process.env.FRONTEND_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  return configured || DEFAULT_BASE_URL;
}

function getVercelProjectPrefix() {
  return (process.env.VERCEL_PROJECT_PREFIX || "beyondmythos").trim();
}

module.exports = { getBaseUrl, getVercelProjectPrefix, DEFAULT_BASE_URL };
