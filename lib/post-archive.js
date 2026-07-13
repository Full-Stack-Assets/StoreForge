const fs = require("fs");
const path = require("path");
const { POSTS_ARCHIVE_DIR } = require("./paths");

function loadPostArchive(siteSlug) {
  try {
    return JSON.parse(fs.readFileSync(path.join(POSTS_ARCHIVE_DIR, `${siteSlug}.json`), "utf8"));
  } catch {
    return [];
  }
}

function savePostArchive(siteSlug, posts) {
  fs.mkdirSync(POSTS_ARCHIVE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(POSTS_ARCHIVE_DIR, `${siteSlug}.json`),
    `${JSON.stringify(posts, null, 2)}\n`,
    "utf8"
  );
}

module.exports = { loadPostArchive, savePostArchive };
