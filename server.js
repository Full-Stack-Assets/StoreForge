const express = require("express");
const cors = require("cors");
const path = require("path");
const Stripe = require("stripe");
const registry = require("./lib/registry");
const { renderDashboard } = require("./lib/dashboard");
const { generateBlogSite, getBaseUrl } = require("./lib/blog-site-generator");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins.length
      ? {
          origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const normalized = origin.replace(/\/+$/, "");
            return callback(null, allowedOrigins.includes(normalized));
          }
        }
      : undefined
  )
);
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

let stripeClient;
function getStripe() {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = Stripe(key);
  return stripeClient;
}

function authorizeCron(req) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  const header = req.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const cronHeader = (req.get("x-cron-secret") || "").trim();
  return bearer === secret || cronHeader === secret;
}

app.get("/", (req, res) => {
  const sites = registry.listSites();
  res.set("Cache-Control", "no-store");
  res.type("html").send(renderDashboard(sites, getBaseUrl()));
});

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", message: "StoreForge API is running" });
});

app.get("/api/blog-sites", (req, res) => {
  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=15");
  res.json({
    count: registry.listSites().length,
    lastGeneratedAt: registry.loadRegistry().lastGeneratedAt,
    sites: registry.listSites()
  });
});

app.post("/api/blog-sites/generate", async (req, res) => {
  if (!authorizeCron(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await generateBlogSite();
    res.status(201).json({ ok: true, site: result.site });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate blog site" });
  }
});

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/store/config", (req, res) => {
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  res.json({
    name: process.env.STORE_NAME || "StoreForge",
    tagline: "Premium products delivered fast",
    primaryColor: "#2563eb",
    secondaryColor: "#f97316"
  });
});

app.get("/api/store/products", async (req, res) => {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
  const products = [
    { id: 1, name: "Wireless Charger", price: 29.99, image: "https://images.unsplash.com/photo-1615526675159-e248c68ef580?w=300", rating: 4.8 },
    { id: 2, name: "Fast Charger 65W", price: 34.99, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300", rating: 4.7 },
    { id: 3, name: "Protective Case", price: 24.99, image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300", rating: 4.5 },
    { id: 4, name: "Screen Protector", price: 12.99, image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300", rating: 4.3 }
  ];
  res.json({ products });
});

app.post("/api/create-checkout", async (req, res) => {
  const items = req.body && Array.isArray(req.body.items) ? req.body.items : null;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Expected non-empty items array" });
  }

  const lineItems = [];
  for (const item of items) {
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    const priceNumber = Number(item?.price);
    const quantityNumber = Number(item?.quantity);

    if (!name) return res.status(400).json({ error: "Each item requires a name" });
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({ error: `Invalid price for item: ${name}` });
    }
    if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      return res.status(400).json({ error: `Invalid quantity for item: ${name}` });
    }

    const unitAmount = Math.round(priceNumber * 100);
    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      return res.status(400).json({ error: `Invalid unit amount for item: ${name}` });
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name },
        unit_amount: unitAmount
      },
      quantity: quantityNumber
    });
  }

  const configuredFrontendUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");
  const requestOrigin = (req.get("origin") || "").trim().replace(/\/+$/, "");
  const frontendUrl = configuredFrontendUrl || requestOrigin;
  if (!frontendUrl) {
    return res.status(500).json({ error: "Missing FRONTEND_URL configuration" });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY configuration" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${frontendUrl}/success`,
      cancel_url: `${frontendUrl}/cancel`
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(502).json({ error: "Failed to create checkout session" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = app;
