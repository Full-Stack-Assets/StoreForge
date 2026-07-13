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
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

module.exports = {
  escapeHtml,
  escapeXml,
  imageFor,
  formatDate,
  formatLongDate
};
