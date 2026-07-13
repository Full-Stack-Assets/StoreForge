/** Server-side product catalog — prices are never accepted from clients. */

const PRODUCTS = [
  // --- Tech accessories (dropship) ---
  {
    id: 1,
    name: "Wireless Charger",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1615526675159-e248c68ef580?w=400",
    rating: 4.8,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "15W Qi-compatible pad for desk or nightstand."
  },
  {
    id: 2,
    name: "Fast Charger 65W",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400",
    rating: 4.7,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "GaN USB-C brick with foldable plug — laptop and phone ready."
  },
  {
    id: 3,
    name: "Protective Phone Case",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400",
    rating: 4.5,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Slim shock-absorbing case with raised camera lip."
  },
  {
    id: 4,
    name: "Tempered Glass Screen Protector (2-pack)",
    price: 12.99,
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400",
    rating: 4.3,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "9H hardness, oleophobic coating, alignment frame included."
  },
  {
    id: 5,
    name: "USB-C Hub 7-in-1",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1625948515291-69613efd293f?w=400",
    rating: 4.6,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "HDMI, SD, USB-A, and pass-through charging in one compact hub."
  },
  {
    id: 6,
    name: "Portable Power Bank 10,000mAh",
    price: 27.99,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400",
    rating: 4.5,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Pocket-size battery with USB-C in/out and flight-safe capacity."
  },
  {
    id: 7,
    name: "Adjustable Laptop Stand",
    price: 32.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
    rating: 4.7,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Aluminum riser for better posture during long writing sessions."
  },
  {
    id: 8,
    name: "Blue Light Blocking Glasses",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400",
    rating: 4.4,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Lightweight frames for late-night editing and research marathons."
  },
  {
    id: 9,
    name: "Webcam Privacy Cover (3-pack)",
    price: 8.99,
    image: "https://images.unsplash.com/photo-1587826080692-f439cd0a37b7?w=400",
    rating: 4.6,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Ultra-thin sliding covers for laptop and external webcams."
  },
  {
    id: 10,
    name: "Desk Cable Management Kit",
    price: 14.99,
    image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400",
    rating: 4.5,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Clips, sleeves, and adhesive channels to tame charger chaos."
  },
  {
    id: 11,
    name: "Mechanical Keyboard Wrist Rest",
    price: 18.99,
    image: "https://images.unsplash.com/photo-1511467659776-f89c07712dca?w=400",
    rating: 4.4,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Memory-foam rest sized for full-size and TKL boards."
  },
  {
    id: 12,
    name: "Ring Light Mini 6\"",
    price: 22.99,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    rating: 4.3,
    type: "physical",
    category: "accessories",
    fulfillment: "dropship",
    description: "Clip-on LED with warm/cool modes for video calls and B-roll."
  },

  // --- BeyondMythos merch (print-on-demand / dropship) ---
  {
    id: 101,
    name: "BeyondMythos Logo Tee",
    price: 26.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    rating: 4.8,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Soft cotton tee with gradient masthead mark — unisex fit."
  },
  {
    id: 102,
    name: "BeyondMythos Hoodie",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    rating: 4.9,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Midweight fleece with embroidered wordmark and kangaroo pocket."
  },
  {
    id: 103,
    name: "BeyondMythos Dad Cap",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400",
    rating: 4.7,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Low-profile cotton cap with tonal embroidered logo."
  },
  {
    id: 104,
    name: "BeyondMythos Canvas Tote",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400",
    rating: 4.6,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Heavy canvas market bag for coffee runs and con hauls."
  },
  {
    id: 105,
    name: "BeyondMythos Sticker Pack (10)",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400",
    rating: 4.8,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Weatherproof vinyl stickers — logos, tags, and inside jokes."
  },
  {
    id: 106,
    name: "BeyondMythos Ceramic Mug 11oz",
    price: 16.99,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
    rating: 4.7,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Gloss white mug with full-wrap gradient dispatch artwork."
  },
  {
    id: 107,
    name: "Dispatch Journal (A5)",
    price: 21.99,
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
    rating: 4.6,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Dot-grid notebook for editorial calendars and field notes."
  },
  {
    id: 108,
    name: "BeyondMythos Poster Print 18×24",
    price: 18.99,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400",
    rating: 4.5,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Matte art print of the live blog stream network map."
  },
  {
    id: 109,
    name: "BeyondMythos Enamel Pin",
    price: 11.99,
    image: "https://images.unsplash.com/photo-1617038260897-41a9f6a5a762?w=400",
    rating: 4.8,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Hard enamel pin with live-dot accent — bag or lapel ready."
  },
  {
    id: 110,
    name: "Creator Crew Socks (3-pack)",
    price: 17.99,
    image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400",
    rating: 4.4,
    type: "physical",
    category: "merch",
    fulfillment: "dropship",
    description: "Combed cotton socks with subtle BeyondMythos stripe pattern."
  },

  // --- Digital products (instant delivery) ---
  {
    id: 201,
    name: "Niche Site Starter Kit",
    price: 29.0,
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400",
    rating: 4.9,
    type: "digital",
    category: "templates",
    fulfillment: "digital",
    description: "PDF playbook: niche research, site structure, and first 30 posts.",
    maxQuantity: 1
  },
  {
    id: 202,
    name: "Blog Launch Checklist",
    price: 9.0,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400",
    rating: 4.8,
    type: "digital",
    category: "templates",
    fulfillment: "digital",
    description: "Notion + printable checklist from domain to first indexed page.",
    maxQuantity: 1
  },
  {
    id: 203,
    name: "Content Calendar Template Pack",
    price: 14.0,
    image: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400",
    rating: 4.7,
    type: "digital",
    category: "templates",
    fulfillment: "digital",
    description: "12-month editorial calendar with archetype rotation built in.",
    maxQuantity: 1
  },
  {
    id: 204,
    name: "AI Blog Prompt Library",
    price: 19.0,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
    rating: 4.8,
    type: "digital",
    category: "templates",
    fulfillment: "digital",
    description: "50+ tested prompts for hourly posts, FAQs, and niche briefs.",
    maxQuantity: 1
  },
  {
    id: 205,
    name: "SEO Dispatch Playbook",
    price: 24.0,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
    rating: 4.7,
    type: "digital",
    category: "guides",
    fulfillment: "digital",
    description: "On-page SEO, internal linking, and RSS strategy for niche sites.",
    maxQuantity: 1
  },
  {
    id: 206,
    name: "BeyondMythos Brand Kit",
    price: 12.0,
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
    rating: 4.9,
    type: "digital",
    category: "templates",
    fulfillment: "digital",
    description: "Logos, color tokens, typography, and social asset templates.",
    maxQuantity: 1
  },
  {
    id: 207,
    name: "Newsletter Archive — Annual Access",
    price: 39.0,
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400",
    rating: 4.6,
    type: "digital",
    category: "guides",
    fulfillment: "digital",
    description: "Searchable archive of every dispatch across the network.",
    maxQuantity: 1
  },
  {
    id: 208,
    name: "Niche Monetization Toolkit",
    price: 34.0,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
    rating: 4.7,
    type: "digital",
    category: "guides",
    fulfillment: "digital",
    description: "Affiliate frameworks, ad placement guides, and product page templates.",
    maxQuantity: 1
  },
  {
    id: 209,
    name: "Static Site Theme Presets (CSS)",
    price: 49.0,
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400",
    rating: 4.8,
    type: "digital",
    category: "templates",
    fulfillment: "digital",
    description: "All six BeyondMythos theme presets as drop-in CSS variable files.",
    maxQuantity: 1
  },
  {
    id: 210,
    name: "Hourly Publishing Automation Guide",
    price: 19.0,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
    rating: 4.8,
    type: "digital",
    category: "guides",
    fulfillment: "digital",
    description: "GitHub Actions + Vercel setup for continuous niche site deployment.",
    maxQuantity: 1
  },
  {
    id: 211,
    name: "Creator Invoice & Media Kit Bundle",
    price: 15.0,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400",
    rating: 4.5,
    type: "digital",
    category: "templates",
    fulfillment: "digital",
    description: "Editable media kit, rate card, and invoice templates for creators.",
    maxQuantity: 1
  },
  {
    id: 212,
    name: "RSS & Feed Syndication Setup Guide",
    price: 9.0,
    image: "https://images.unsplash.com/photo-1611162617474-5b21e939e113?w=400",
    rating: 4.6,
    type: "digital",
    category: "guides",
    fulfillment: "digital",
    description: "Feed validation, reader onboarding, and cross-site syndication how-to.",
    maxQuantity: 1
  }
];

const byId = new Map(PRODUCTS.map((product) => [product.id, product]));

function listProducts(filters = {}) {
  let results = PRODUCTS;

  if (filters.type) {
    results = results.filter((product) => product.type === filters.type);
  }
  if (filters.category) {
    results = results.filter((product) => product.category === filters.category);
  }
  if (filters.fulfillment) {
    results = results.filter((product) => product.fulfillment === filters.fulfillment);
  }

  return results.map(publicProduct);
}

function publicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    rating: product.rating,
    type: product.type,
    category: product.category,
    fulfillment: product.fulfillment,
    description: product.description,
    ...(product.maxQuantity ? { maxQuantity: product.maxQuantity } : {})
  };
}

function listCategories() {
  return [...new Set(PRODUCTS.map((product) => product.category))].sort();
}

function listProductTypes() {
  return [...new Set(PRODUCTS.map((product) => product.type))].sort();
}

function getProductById(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  return byId.get(numericId) || null;
}

module.exports = {
  listProducts,
  listCategories,
  listProductTypes,
  getProductById,
  publicProduct,
  PRODUCTS
};
