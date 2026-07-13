#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "..", "lib", "content-generator.js");
const src = fs.readFileSync(srcPath, "utf8");
const lines = src.split("\n");

const themesBlock = lines.slice(11, 101).join("\n");
fs.writeFileSync(
  path.join(__dirname, "..", "lib", "themes.js"),
  `// Theme presets modeled on reference dispatch sites.\n${themesBlock}\n\nmodule.exports = { THEMES, themeKeyForNiche };\n`
);

const postTemplatesBlock = lines.slice(155, 280).join("\n");
const hourlyBlock = lines.slice(396, 558).join("\n");
fs.writeFileSync(
  path.join(__dirname, "..", "lib", "templates.js"),
  `const { slugify } = require("./slug");\n\n${postTemplatesBlock}\n\n${hourlyBlock}\n\nmodule.exports = { postTemplates, hourlyPostTemplate };\n`
);

const geminiHeader = [
  'const { slugify } = require("./slug");',
  'const { postTemplates } = require("./templates");',
  'const { POSTS_PER_SITE } = require("./paths");',
  "",
  "function parseGeminiJson(text) {",
  '  const cleaned = text.replace(/^```json\\s*/i, "").replace(/```\\s*$/i, "").trim();',
  "  return JSON.parse(cleaned);",
  "}",
  ""
].join("\n");
const geminiBlock = lines.slice(281, 343).join("\n");
const hourlyGeminiBlock = lines.slice(559, 600).join("\n");
fs.writeFileSync(
  path.join(__dirname, "..", "lib", "gemini.js"),
  `${geminiHeader}${geminiBlock}\n\n${hourlyGeminiBlock}\n\nmodule.exports = { parseGeminiJson, generatePostsWithGemini, generateHourlyPostWithGemini };\n`
);

const rendererHeader = `const fs = require("fs");
const path = require("path");
const { PUBLIC_SITES_DIR } = require("./paths");
const { savePostArchive } = require("./post-archive");
const { themeKeyForNiche, THEMES } = require("./themes");
const { escapeHtml, escapeXml, imageFor, formatDate, formatLongDate } = require("./html-utils");

`;
const rendererBlock = lines.slice(638, 1135).join("\n");
fs.writeFileSync(
  path.join(__dirname, "..", "lib", "renderer.js"),
  `${rendererHeader}${rendererBlock}\n\nmodule.exports = { writeSiteFiles, renderHome, renderPost, renderFeed, themeCss };\n`
);

console.log("Split complete");
