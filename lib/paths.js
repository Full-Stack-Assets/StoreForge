const path = require("path");

const PUBLIC_SITES_DIR = path.join(__dirname, "..", "public", "sites");
const POSTS_ARCHIVE_DIR = path.join(__dirname, "..", "data", "posts");

const POSTS_PER_SITE = 6;
const HOURS_BETWEEN_POSTS = 37;

module.exports = {
  PUBLIC_SITES_DIR,
  POSTS_ARCHIVE_DIR,
  POSTS_PER_SITE,
  HOURS_BETWEEN_POSTS
};
