function renderDashboard(sites, baseUrl) {
  const cards = sites.length
    ? sites
        .map((site) => {
          const localUrl = `/sites/${site.slug}/`;
          const standaloneUrl = site.vercel && site.vercel.url ? site.vercel.url : null;
          const mainUrl = standaloneUrl || localUrl;
          return `<article class="site-card">
            <div class="site-meta">
              <span class="pill">${escapeHtml(site.nicheId)}</span>
              ${standaloneUrl ? '<span class="pill standalone">standalone</span>' : ""}
              <time datetime="${escapeHtml(site.createdAt)}">${escapeHtml(formatRelative(site.createdAt))}</time>
            </div>
        <h2><a href="${escapeHtml(mainUrl)}" target="_blank" rel="noopener">${escapeHtml(site.name)}</a></h2>
            <p>${escapeHtml(site.tagline)}</p>
            <div class="site-links">
              <span>
                <a href="${escapeHtml(mainUrl)}" target="_blank" rel="noopener">Visit site →</a>
                ${standaloneUrl ? `<a href="${escapeHtml(localUrl)}" target="_blank" rel="noopener">Local copy</a>` : ""}
              </span>
              <span>${site.postCount} posts</span>
            </div>
          </article>`;
        })
        .join("\n")
    : `<div class="empty">
        <h2>No blog sites yet</h2>
        <p>Connect the hourly workflow or call <code>POST /api/blog-sites/generate</code> to launch the stream.</p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="60" />
  <title>BeyondMythos · Live Blog Stream</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --panel: #121933;
      --text: #eef2ff;
      --muted: #94a3b8;
      --accent: #60a5fa;
      --accent-2: #f97316;
      --border: rgba(148, 163, 184, 0.18);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: radial-gradient(circle at top, #172554 0%, var(--bg) 42%);
      color: var(--text);
      min-height: 100vh;
    }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    header.hero {
      display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem;
      margin-bottom: 2rem; align-items: end;
    }
    .eyebrow { color: var(--accent-2); text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.75rem; margin: 0 0 0.5rem; }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 3rem); }
    .stats { display: flex; gap: 1rem; flex-wrap: wrap; }
    .stat {
      background: rgba(255,255,255,0.04); border: 1px solid var(--border);
      border-radius: 999px; padding: 0.65rem 1rem; color: var(--muted); font-size: 0.95rem;
    }
    .stat strong { color: var(--text); }
    .stream { display: grid; gap: 1rem; }
    .site-card {
      background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
      border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem 1.35rem;
      animation: rise 0.35s ease both;
    }
    .site-card:nth-child(1) { animation-delay: 0.05s; }
    .site-card:nth-child(2) { animation-delay: 0.1s; }
    .site-card:nth-child(3) { animation-delay: 0.15s; }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .site-meta { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 0.75rem; color: var(--muted); font-size: 0.85rem; }
    .pill { background: rgba(96,165,250,0.15); color: var(--accent); padding: 0.2rem 0.55rem; border-radius: 999px; }
    .pill.standalone { background: rgba(249,115,22,0.15); color: var(--accent-2); }
    .site-meta time { margin-left: auto; }
    .site-links span a + a { margin-left: 0.75rem; font-weight: 400; font-size: 0.9rem; }
    .site-card h2 { margin: 0 0 0.4rem; font-size: 1.35rem; }
    .site-card h2 a { color: inherit; text-decoration: none; }
    .site-card h2 a:hover { color: var(--accent); }
    .site-card p { margin: 0; color: var(--muted); line-height: 1.5; }
    .site-links { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1rem; align-items: center; }
    .site-links a { color: var(--accent); text-decoration: none; font-weight: 600; }
    .empty, .footer-note {
      border: 1px dashed var(--border); border-radius: 1rem; padding: 2rem; color: var(--muted);
    }
    code { color: var(--accent); }
    .footer-note { margin-top: 2rem; font-size: 0.92rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <div>
        <p class="eyebrow">BeyondMythos</p>
        <h1>Live blog deployment stream</h1>
      </div>
      <div class="stats">
        <div class="stat"><strong>${sites.length}</strong> sites deployed</div>
        <div class="stat">Auto-refresh <strong>60s</strong></div>
      </div>
    </header>
    <section class="stream">${cards}</section>
    <p class="footer-note">
      API: <a href="/api/status" style="color:var(--accent)">/api/status</a> ·
      Sites JSON: <a href="/api/blog-sites" style="color:var(--accent)">/api/blog-sites</a> ·
      Hourly workflow deploys each new site to its own Vercel project and commits a copy to <code>public/sites/</code>.
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRelative(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = { renderDashboard };
