# Dockerfile - Save this as "Dockerfile" (no extension)
FROM node:18-alpine

WORKDIR /app

# Create package.json
RUN echo '{
  "name": "storeforge",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "stripe": "^14.16.0",
    "openai": "^4.20.0"
  }
}' > package.json

# Create server.js
RUN echo 'const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "StoreForge API is running" });
});

// Store config
app.get("/api/store/config", (req, res) => {
  res.json({
    name: process.env.STORE_NAME || "StoreForge",
    tagline: "Premium products delivered fast",
    primaryColor: "#2563eb",
    secondaryColor: "#f97316"
  });
});

// Products endpoint with CJ integration
app.get("/api/store/products", async (req, res) => {
  const products = [
    { id: 1, name: "Wireless Charger", price: 29.99, image: "https://images.unsplash.com/photo-1615526675159-e248c68ef580?w=300", rating: 4.8 },
    { id: 2, name: "Fast Charger 65W", price: 34.99, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300", rating: 4.7 },
    { id: 3, name: "Protective Case", price: 24.99, image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300", rating: 4.5 },
    { id: 4, name: "Screen Protector", price: 12.99, image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300", rating: 4.3 }
  ];
  res.json({ products });
});

// Create checkout session
app.post("/api/create-checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: req.body.items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    })),
    mode: "payment",
    success_url: "https://your-app.railway.app/success",
    cancel_url: "https://your-app.railway.app/cancel"
  });
  res.json({ url: session.url });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));' > server.js

RUN npm install

EXPOSE 3000
CMD ["npm", "start"]
