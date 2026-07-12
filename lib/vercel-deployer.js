const fs = require("fs");
const path = require("path");

const VERCEL_API = "https://api.vercel.com";
const READY_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 3_000;

function isConfigured() {
  return Boolean((process.env.VERCEL_TOKEN || "").trim());
}

function projectNameForSlug(slug) {
  const prefix = (process.env.VERCEL_PROJECT_PREFIX || "storeforge").trim();
  return `${prefix}-${slug}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function collectFiles(dir, base = "") {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = base ? `${base}/${entry.name}` : entry.name;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolute, relative));
    } else if (entry.isFile()) {
      files.push({
        file: relative,
        data: fs.readFileSync(absolute).toString("base64"),
        encoding: "base64"
      });
    }
  }
  return files;
}

function apiUrl(pathname) {
  const teamId = (process.env.VERCEL_TEAM_ID || "").trim();
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  return `${VERCEL_API}${pathname}${query}`;
}

async function vercelFetch(pathname, options = {}) {
  const token = (process.env.VERCEL_TOKEN || "").trim();
  const response = await fetch(apiUrl(pathname), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Vercel API ${pathname} failed: ${message}`);
  }
  return payload;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilReady(deploymentId) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let deployment;
  while (Date.now() < deadline) {
    deployment = await vercelFetch(`/v13/deployments/${deploymentId}`);
    if (deployment.readyState === "READY") return deployment;
    if (deployment.readyState === "ERROR" || deployment.readyState === "CANCELED") {
      throw new Error(`Vercel deployment ${deploymentId} ended in state ${deployment.readyState}`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return deployment;
}

/**
 * Deploys a generated site directory as its own standalone Vercel project.
 * The project is created automatically on first deployment of its name.
 * Returns { projectName, url, deploymentId, deploymentUrl, readyState }.
 */
async function deploySiteToVercel(site, siteDir) {
  if (!isConfigured()) {
    throw new Error("VERCEL_TOKEN is not set");
  }
  if (!fs.existsSync(siteDir)) {
    throw new Error(`Site directory not found: ${siteDir}`);
  }

  const projectName = projectNameForSlug(site.slug);
  const files = collectFiles(siteDir);
  if (files.length === 0) {
    throw new Error(`No files to deploy in ${siteDir}`);
  }

  const created = await vercelFetch("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: projectName,
      target: "production",
      files,
      projectSettings: { framework: null }
    })
  });

  const ready = await waitUntilReady(created.id).catch((error) => {
    console.warn(`Vercel readiness check failed: ${error.message}`);
    return created;
  });

  const alias = Array.isArray(ready?.alias) && ready.alias.length > 0 ? ready.alias[0] : null;
  const url = `https://${alias || `${projectName}.vercel.app`}`;

  return {
    projectName,
    url,
    deploymentId: created.id,
    deploymentUrl: `https://${created.url}`,
    readyState: ready?.readyState || created.readyState
  };
}

module.exports = { isConfigured, deploySiteToVercel, projectNameForSlug };
