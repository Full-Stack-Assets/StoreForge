#!/usr/bin/env node
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { slugify } = require("../lib/slug");
const { buildCheckoutLineItems } = require("../lib/checkout");
const { getProductById, listProducts } = require("../lib/products");
const { parseGeminiJson } = require("../lib/gemini");
const { postTemplates, hourlyPostTemplate } = require("../lib/templates");
const { themeKeyForNiche, THEMES } = require("../lib/themes");
const { mapWithConcurrency } = require("../lib/concurrency");
const { getBaseUrl } = require("../lib/config");

describe("slugify", () => {
  it("converts text to kebab-case", () => {
    assert.equal(slugify("Hello World!"), "hello-world");
    assert.equal(slugify("  Retro   Gaming  "), "retro-gaming");
  });

  it("truncates long slugs", () => {
    const long = "a".repeat(60);
    assert.equal(slugify(long).length, 48);
  });
});

describe("products and checkout", () => {
  it("lists catalog products with stable ids", () => {
    const products = listProducts();
    assert.ok(products.length >= 30);
    assert.ok(getProductById(1));
    assert.equal(getProductById(1).price, 29.99);
  });

  it("filters products by type and category", () => {
    const digital = listProducts({ type: "digital" });
    const merch = listProducts({ category: "merch" });
    assert.ok(digital.length >= 10);
    assert.ok(digital.every((product) => product.type === "digital"));
    assert.ok(merch.length >= 8);
    assert.ok(merch.every((product) => product.category === "merch"));
  });

  it("rejects unknown product ids", () => {
    const result = buildCheckoutLineItems([{ id: 999, quantity: 1 }]);
    assert.match(result.error, /Unknown product/);
  });

  it("rejects client-supplied prices in favor of catalog prices", () => {
    const result = buildCheckoutLineItems([{ id: 1, quantity: 2, price: 0.01, name: "Hacked" }]);
    assert.equal(result.lineItems.length, 1);
    assert.equal(result.lineItems[0].price_data.unit_amount, 2999);
    assert.equal(result.lineItems[0].price_data.product_data.name, "Wireless Charger");
    assert.equal(result.lineItems[0].price_data.product_data.metadata.type, "physical");
  });

  it("rejects invalid quantities", () => {
    const result = buildCheckoutLineItems([{ id: 1, quantity: 0 }]);
    assert.match(result.error, /Invalid quantity/);
  });

  it("limits digital products to one per order", () => {
    const result = buildCheckoutLineItems([{ id: 201, quantity: 2 }]);
    assert.match(result.error, /Digital products are limited/);
  });
});

describe("gemini JSON parsing", () => {
  it("strips markdown fences before parsing", () => {
    const parsed = parseGeminiJson('```json\n{"title":"Test"}\n```');
    assert.equal(parsed.title, "Test");
  });
});

describe("templates", () => {
  const niche = {
    id: "retro-gaming",
    name: "Retro Pixel Press",
    audience: "retro game collectors",
    categories: ["Hardware", "Speedruns", "Preservation", "Indie"],
    subreddits: ["retrogaming"],
    braveQueries: ["crt setup guide"]
  };

  it("generates starter post blueprints", () => {
    const posts = postTemplates(niche);
    assert.equal(posts.length, 6);
    assert.ok(posts[0].title);
    assert.ok(Array.isArray(posts[0].faq));
    assert.ok(posts[0].sources.length >= 1);
  });

  it("rotates hourly archetypes by niche", () => {
    const post = hourlyPostTemplate(niche, 3);
    assert.ok(post.title);
    assert.ok(post.slug);
    assert.ok(niche.categories.includes(post.category));
  });
});

describe("themes", () => {
  it("maps known niches to preset themes", () => {
    assert.equal(themeKeyForNiche("retro-gaming"), "cinema");
    assert.equal(themeKeyForNiche("home-coffee"), "ember");
  });

  it("falls back to a hash-based theme for unknown niches", () => {
    const key = themeKeyForNiche("unknown-niche");
    assert.ok(THEMES[key]);
  });
});

describe("concurrency helper", () => {
  it("runs mappers with a concurrency limit", async () => {
    const order = [];
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
      order.push(value);
      return value * 2;
    });
    assert.deepEqual(results, [2, 4, 6, 8]);
    assert.equal(order.length, 4);
  });
});

describe("config", () => {
  it("prefers BEYONDMYTHOS_URL over legacy aliases", () => {
    const previous = {
      beyond: process.env.BEYONDMYTHOS_URL,
      store: process.env.STOREFORGE_URL,
      front: process.env.FRONTEND_URL
    };
    process.env.BEYONDMYTHOS_URL = "https://beyond.example.com/";
    delete process.env.STOREFORGE_URL;
    delete process.env.FRONTEND_URL;
    assert.equal(getBaseUrl(), "https://beyond.example.com");

    if (previous.beyond === undefined) delete process.env.BEYONDMYTHOS_URL;
    else process.env.BEYONDMYTHOS_URL = previous.beyond;
    if (previous.store === undefined) delete process.env.STOREFORGE_URL;
    else process.env.STOREFORGE_URL = previous.store;
    if (previous.front === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previous.front;
  });
});
