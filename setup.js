const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = 'C:\\BeautyEssentials';

const files = {
  // package.json
  'package.json': JSON.stringify({
    name: "beauty-essentials-store",
    version: "1.0.0",
    description: "Beauty Essentials - Resell & Glow Online Shop Ghana",
    main: "server/server.js",
    scripts: { start: "node server/server.js" },
    dependencies: {
      axios: "^1.6.0",
      cors: "^2.8.5",
      dotenv: "^16.3.1",
      express: "^4.18.2"
    }
  }, null, 2),

  // server/.env
  'server/.env': `PAYSTACK_SECRET_KEY=sk_live_YOUR_PAYSTACK_KEY
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PAYSTACK_KEY
PORT=3000
BASE_URL=http://localhost:3000
ADMIN_PASSWORD=admin123
`,

  // server/server.js
  'server/server.js': `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Pre-loaded all 13 items directly from flyer
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Lip Gloss", price: 25, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Shiny, non-sticky high-shine lip gloss for plush, hydrated lips." },
  { id: 2, name: "Head Band (Soft Fleece)", price: 20, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", description: "Cute plush spa headbands for skincare, makeup, and facial wash." },
  { id: 3, name: "Lipstick Set", price: 35, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Richly pigmented, smooth matte lipstick shades." },
  { id: 4, name: "Pearl Hair Clips", price: 15, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Elegant pearl-decorated hair pins for stylish hair styling." },
  { id: 5, name: "Edges Control Cream", price: 30, category: "Hair Care", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400", description: "Strong hold, long-lasting edge control for sleek hairline styling." },
  { id: 6, name: "Resell & Glow Starter Package", price: 150, category: "Resell Bundles", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400", description: "Wholesale beauty bundle packed with essentials to start your own resell business!" },
  { id: 7, name: "Hair Pins Pack", price: 10, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Durable metallic bobby pins for secure hair styling." },
  { id: 8, name: "Styling Hair Comb Set", price: 15, category: "Hair Tools", image: "https://images.unsplash.com/photo-1590540179852-2110a54f813a?w=400", description: "Wide-tooth and rat-tail styling combs for parting and detangling." },
  { id: 9, name: "Butterfly Hair Clips", price: 18, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Vibrant and trendy butterfly clips for a retro chic look." },
  { id: 10, name: "Matte Claw Clips", price: 20, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Strong grip claw clips for half-up and full bun hairstyles." },
  { id: 11, name: "Hair Bonds / Bands", price: 12, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Soft elastic seamless hair ties that won't pull or break hair." },
  { id: 12, name: "Cute Beaded Bracelets", price: 25, category: "Jewelry", image: "https://images.unsplash.com/photo-1611591475168-a40552ebdbdb?w=400", description: "Stackable pastel beaded charm bracelets." },
  { id: 13, name: "Gold Ring Stacks", price: 30, category: "Jewelry", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400", description: "Trendy bohemian multi-piece ring stack set." }
];

const DEFAULT_SETTINGS = {
  storeName: "Beauty Essentials",
  tagline: "CUTE. STYLISH. YOU.",
  announcement: "⚡ RESELL & GLOW! Everything you need to look good, feel good & slay every day! ♥",
  heroTitle: "Your Beauty Essentials Spot ♥",
  heroSubtitle: "Trendy & affordable beauty accessories, lip glosses, hair clips & resell bundles.",
  whatsappNumber: "233548950991",
  supportPhone1: "0548950991",
  supportPhone2: "0249356589",
  supportEmail: "orders@beautyessentials.com",
  shopAddress: "Accra, Ghana"
};

function getJson(file, def) { try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); } catch(e){} return def; }
function saveJson(file, data) { try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch(e){} }

if (!fs.existsSync(PRODUCTS_FILE)) saveJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
if (!fs.existsSync(SETTINGS_FILE)) saveJson(SETTINGS_FILE, DEFAULT_SETTINGS);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/products', (req, res) => res.json(getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS)));
app.get('/api/settings', (req, res) => res.json(getJson(SETTINGS_FILE, DEFAULT_SETTINGS)));

app.get('/api/orders/:ref', async (req, res) => {
  const ref = (req.params.ref || '').trim();
  const orders = getJson(ORDERS_FILE, []);
  let order = orders.find(o => o.reference && o.reference.toLowerCase() === ref.toLowerCase());
  if (order) return res.json({ success: true, order });

  try {
    const ps = (process.env.PAYSTACK_SECRET_KEY || '').trim();
    if (ps) {
      const pr = await axios.get('https://api.paystack.co/transaction/verify/' + ref, { headers: { Authorization: 'Bearer ' + ps } });
      if (pr.data.status && pr.data.data.status === 'success') {
        const tx = pr.data.data;
        const no = {
          reference: tx.reference,
          amount: tx.amount / 100,
          customerEmail: tx.customer.email,
          customerName: tx.metadata?.customerName || tx.customer.email,
          phone: tx.metadata?.phone || 'N/A',
          address: tx.metadata?.address || 'Accra, Ghana',
          items: tx.metadata?.itemsSummary || 'Beauty Order',
          status: 'Packaging',
          deliveryNote: 'Order confirmed and being prepared for delivery!',
          paidAt: tx.paid_at || new Date().toISOString()
        };
        orders.push(no);
        saveJson(ORDERS_FILE, orders);
        return res.json({ success: true, order: no });
      }
    }
  } catch(e){}
  res.status(404).json({ success: false, message: 'Order not found' });
});

// Paystack Initialization
app.post('/api/payment/initialize', async (req, res) => {
  try {
    const { email, amount, metadata, callback_url } = req.body;
    const ps = (process.env.PAYSTACK_SECRET_KEY || '').trim();
    const r = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: Math.round(amount * 100),
      currency: 'GHS',
      channels: ['card', 'mobile_money'],
      callback_url: callback_url || (process.env.BASE_URL + '/success'),
      metadata
    }, { headers: { Authorization: 'Bearer ' + ps, 'Content-Type': 'application/json' } });
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ status: false, message: 'Payment failed' });
  }
});

// Direct MoMo Submission
app.post('/api/payment/direct-momo', (req, res) => {
  const { name, email, phone, address, transactionId, amount, itemsSummary } = req.body;
  const orders = getJson(ORDERS_FILE, []);
  const newOrder = {
    reference: transactionId.trim(),
    amount: Number(amount),
    customerEmail: email,
    customerName: name || 'Customer',
    phone: phone,
    address: address,
    items: itemsSummary,
    status: 'Awaiting MoMo Verification',
    deliveryNote: 'Direct MoMo transfer registered. Awaiting verification.',
    paidAt: new Date().toISOString()
  };
  orders.push(newOrder);
  saveJson(ORDERS_FILE, orders);
  res.json({ success: true, reference: transactionId.trim() });
});

// Admin endpoints
function verifyAdmin(req, res, next) {
  if (req.body.password !== (process.env.ADMIN_PASSWORD || 'admin123')) return res.status(401).json({ success: false, message: 'Wrong password' });
  next();
}

app.post('/api/admin/orders', verifyAdmin, (req, res) => res.json({ success: true, orders: getJson(ORDERS_FILE, []).reverse() }));

app.post('/api/admin/update-progress', verifyAdmin, (req, res) => {
  const orders = getJson(ORDERS_FILE, []);
  const o = orders.find(x => x.reference.toLowerCase() === (req.body.reference || '').toLowerCase());
  if (o) {
    o.status = req.body.status || o.status;
    o.deliveryNote = req.body.deliveryNote || '';
    saveJson(ORDERS_FILE, orders);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false });
});

app.post('/api/admin/products/save', verifyAdmin, (req, res) => {
  let products = getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  const p = req.body.product;
  if (p.id) {
    const i = products.findIndex(x => x.id === Number(p.id));
    if (i !== -1) products[i] = { ...products[i], ...p, id: Number(p.id), price: Number(p.price) };
  } else {
    products.push({ ...p, id: Date.now(), price: Number(p.price) });
  }
  saveJson(PRODUCTS_FILE, products);
  res.json({ success: true });
});

app.post('/api/admin/products/delete', verifyAdmin, (req, res) => {
  saveJson(PRODUCTS_FILE, getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS).filter(p => p.id !== Number(req.body.productId)));
  res.json({ success: true });
});

app.post('/api/admin/settings/save', verifyAdmin, (req, res) => {
  saveJson(SETTINGS_FILE, { ...getJson(SETTINGS_FILE, DEFAULT_SETTINGS), ...req.body.settings });
  res.json({ success: true });
});

// Page routes
app.get('/', (r, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get(['/cart', '/cart.html'], (r, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cart.html')));
app.get(['/checkout', '/checkout.html'], (r, res) => res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html')));
app.get(['/success', '/success.html'], (r, res) => res.sendFile(path.join(__dirname, '..', 'public', 'success.html')));
app.get(['/track', '/track.html'], (r, res) => res.sendFile(path.join(__dirname, '..', 'public', 'track.html')));
app.get(['/admin', '/admin.html'], (r, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));

app.listen(PORT, () => console.log('Beauty Essentials Store live on http://localhost:' + PORT));
`,

  // public/css/styles.css
  'public/css/styles.css': `:root {
  --primary: #ff4d8d;
  --primary-dark: #d62865;
  --secondary: #ff85b3;
  --accent: #f59e0b;
  --dark: #1a1a2e;
  --pink-bg: #fff0f5;
  --gray-100: #fff5f8;
  --gray-200: #fce7f0;
  --gray-300: #f472b6;
  --gray-600: #6c757d;
  --white: #ffffff;
  --success: #10b981;
  --radius: 14px;
  --shadow: 0 4px 20px rgba(255, 77, 141, 0.12);
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: var(--pink-bg); color: var(--dark); line-height:1.6; }
a { text-decoration:none; color:inherit; }

.announcement-bar { background: var(--primary-dark); color: #fff; text-align: center; padding: 0.5rem 1rem; font-size: 0.88rem; font-weight: 700; }
.navbar { background: #fff; padding: 1rem 2rem; box-shadow: 0 2px 12px rgba(255, 77, 141, 0.1); display: flex; justify-content: space-between; align-items: center; position: sticky; top:0; z-index:100; }
.navbar-brand { font-size: 1.5rem; font-weight: 800; color: var(--primary-dark); display:flex; align-items:center; gap:0.4rem; }
.navbar-brand span { color: var(--secondary); font-size:0.9rem; font-style:italic; }
.navbar-links { display: flex; list-style: none; gap: 1.5rem; align-items: center; }
.navbar-links a { font-weight: 600; color: var(--dark); transition:0.2s; }
.navbar-links a:hover { color: var(--primary); }

.cart-icon { position: relative; font-size: 1.4rem; }
.cart-count { position: absolute; top: -8px; right: -10px; background: var(--primary); color: #fff; border-radius: 50%; font-size: 0.75rem; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; }

.hero { background: linear-gradient(135deg, var(--primary) 0%, #a21caf 100%); color: white; padding: 3.5rem 2rem; text-align: center; border-radius: 0 0 30px 30px; }
.hero h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
.hero p { font-size: 1.1rem; opacity: 0.95; max-width: 650px; margin: 0 auto; }

.why-love-strip { max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; }
.why-love-card { background: #fff; border-radius: var(--radius); padding: 1.8rem; box-shadow: var(--shadow); border: 2px dashed var(--secondary); text-align: center; }
.why-love-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; text-align: left; }
.why-item { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--primary-dark); }

.filter-section { display: flex; justify-content: center; gap: 0.6rem; margin: 1.5rem 0; flex-wrap: wrap; }
.filter-btn { padding: 0.5rem 1.3rem; border: 2px solid var(--secondary); border-radius: 50px; background: #fff; color: var(--primary-dark); font-weight: 700; cursor: pointer; transition: 0.2s; }
.filter-btn.active, .filter-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.8rem; max-width: 1200px; margin: 0 auto; padding: 1rem 1.5rem 3rem; }
.product-card { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); display: flex; flex-direction: column; transition: transform 0.2s; border: 1px solid var(--gray-200); }
.product-card:hover { transform: translateY(-5px); }
.product-card img { width: 100%; height: 230px; object-fit: cover; }
.product-info { padding: 1.2rem; flex: 1; display: flex; flex-direction: column; }
.product-category { color: var(--primary); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.product-name { font-size: 1.15rem; font-weight: 700; margin: 0.3rem 0; color: var(--dark); }
.product-desc { color: var(--gray-600); font-size: 0.85rem; margin-bottom: 0.8rem; flex: 1; }
.product-price { font-size: 1.3rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.8rem; }

.btn { width: 100%; background: var(--primary); color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn:hover { background: var(--primary-dark); }
.btn-accent { background: #10b981; }
.btn-accent:hover { background: #059669; }

.page-container { max-width: 950px; margin: 2rem auto; padding: 0 1rem; }
.checkout-layout, .cart-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
.checkout-form, .cart-summary { background: #fff; padding: 1.8rem; border-radius: var(--radius); box-shadow: var(--shadow); height: fit-content; border: 1px solid var(--gray-200); }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-weight: 700; margin-bottom: 0.3rem; font-size: 0.88rem; color: var(--dark); }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1.5px solid var(--secondary); border-radius: 8px; font-size: 0.95rem; outline: none; }
.summary-row { display: flex; justify-content: space-between; margin: 0.6rem 0; }
.summary-row.total { font-size: 1.25rem; font-weight: 800; border-top: 2px solid var(--gray-200); padding-top: 0.8rem; margin-top: 0.8rem; color: var(--primary-dark); }
.toast { position: fixed; bottom: 20px; right: 20px; background: var(--dark); color: white; padding: 12px 20px; border-radius: 8px; display: none; z-index: 1000; }

.contact-card { background: #fff; border-radius: var(--radius); padding: 2rem; box-shadow: var(--shadow); text-align: center; margin: 3rem auto; max-width: 800px; border: 2px solid var(--secondary); }
.contact-numbers { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 1rem; }
.contact-btn { background: #25D366; color: white; padding: 0.8rem 1.5rem; border-radius: 50px; font-weight: bold; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }

.footer { background: var(--dark); color: #f472b6; padding: 2.5rem 1.5rem 1.5rem; margin-top: 4rem; text-align: center; font-size: 0.9rem; }
@media (max-width: 768px) { .checkout-layout, .cart-layout { grid-template-columns: 1fr; } .hero h1 { font-size: 1.9rem; } }
`,

  // public/index.html
  'public/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beauty Essentials - Resell & Glow</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="announcement-bar" id="announcementBar">⚡ RESELL & GLOW! Everything you need to look good, feel good & slay every day! ♥</div>

  <nav class="navbar">
    <a href="/" class="navbar-brand">👑 Beauty <span>Essentials</span></a>
    <ul class="navbar-links">
      <li><a href="/">Home</a></li>
      <li><a href="#whyLove">Why Us</a></li>
      <li><a href="/track">Track Order 📦</a></li>
      <li><a href="/cart" class="cart-icon">🛒 <span class="cart-count" id="cartCount">0</span></a></li>
    </ul>
  </nav>

  <header class="hero">
    <h1 id="heroTitle">Your Beauty Essentials Spot ♥</h1>
    <p id="heroSubtitle">CUTE. STYLISH. YOU. Everything you need to look good, feel good & slay every day!</p>
  </header>

  <!-- Why You'll Love It Banner -->
  <section class="why-love-strip" id="whyLove">
    <div class="why-love-card">
      <h2 style="color: var(--primary-dark); margin-bottom: 0.3rem;">Why You'll Love It! ♡</h2>
      <div class="why-love-grid">
        <div class="why-item">💖 Trendy & Affordable</div>
        <div class="why-item">✨ Good Quality Assurance</div>
        <div class="why-item">🎀 Perfect for Everyday</div>
        <div class="why-item">🛍️ Great for Reselling & Profit</div>
        <div class="why-item">👑 Handpicked Just for You!</div>
        <div class="why-item">🚚 Fast Doorstep Delivery</div>
      </div>
    </div>
  </section>

  <!-- Filter Section -->
  <div class="filter-section">
    <button class="filter-btn active" onclick="filterCat('all', this)">All Essentials</button>
    <button class="filter-btn" onclick="filterCat('Lips', this)">Lips 💋</button>
    <button class="filter-btn" onclick="filterCat('Hair Accessories', this)">Hair Accessories 🎀</button>
    <button class="filter-btn" onclick="filterCat('Resell Bundles', this)">Resell Packages 🛍️</button>
    <button class="filter-btn" onclick="filterCat('Jewelry', this)">Jewelry 💍</button>
  </div>

  <main class="products-grid" id="productsGrid"></main>

  <!-- Contact Us Strip -->
  <section class="contact-card">
    <h2 style="color: var(--primary-dark); margin-bottom: 0.5rem;">Let's Glow Together! ♡</h2>
    <p style="color: var(--gray-600);">Call or WhatsApp us for instant orders, wholesale resell inquiries, and delivery updates:</p>
    <div class="contact-numbers">
      <a href="https://wa.me/233548950991" target="_blank" class="contact-btn">💬 WhatsApp +233 548 950 991</a>
      <a href="https://wa.me/233249356589" target="_blank" class="contact-btn">💬 WhatsApp +233 24 935 6589</a>
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2025 Beauty Essentials. Resell & Profit. Fast Delivery & Quality You Can Trust.</p>
  </footer>

  <div class="toast" id="toast"></div>
  <script src="/js/app.js"></script>
</body>
</html>
`,

  // public/cart.html
  'public/cart.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shopping Cart - Beauty Essentials</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <nav class="navbar"><a href="/" class="navbar-brand">👑 Beauty <span>Essentials</span></a><ul class="navbar-links"><li><a href="/">← Continue Shopping</a></li></ul></nav>
  <div class="page-container">
    <h2 style="margin-bottom: 1.5rem; color: var(--primary-dark);">Your Beauty Cart 🛍️</h2>
    <div class="cart-layout">
      <div id="cartItems"></div>
      <div class="cart-summary" id="cartSummary"></div>
    </div>
  </div>
  <script src="/js/cart.js"></script>
</body>
</html>
`,

  // public/checkout.html
  'public/checkout.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Checkout - Beauty Essentials</title>
  <link rel="stylesheet" href="/css/styles.css">
  <style>
    .pay-tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.2rem; }
    .pay-tab { flex: 1; padding: 0.8rem; border: none; font-weight: bold; background: #fce7f0; color: var(--primary-dark); cursor: pointer; border-radius: 8px 8px 0 0; text-align: center; }
    .pay-tab.active { background: var(--primary); color: white; }
    .direct-momo-box { display: none; background: #fffcf0; border: 1.5px solid #f59e0b; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; }
    .momo-num { background: #1a1a2e; color: #f59e0b; font-family: monospace; font-size: 1.2rem; font-weight: bold; padding: 0.6rem; border-radius: 6px; text-align: center; margin: 0.4rem 0; }
  </style>
</head>
<body>
  <nav class="navbar"><a href="/" class="navbar-brand">👑 Beauty <span>Essentials</span></a><ul class="navbar-links"><li><a href="/cart">← Back to Cart</a></li></ul></nav>
  <div class="page-container">
    <h2 style="margin-bottom: 1.5rem; color: var(--primary-dark);">Checkout & Delivery Details 💖</h2>
    <div class="checkout-layout">
      <div class="checkout-form">
        <div class="pay-tab-bar">
          <button class="pay-tab active" id="btnOnline" onclick="setPayment('online')">📱 Paystack (MoMo/Card)</button>
          <button class="pay-tab" id="btnDirect" onclick="setPayment('direct')">💳 Direct MoMo Transfer</button>
        </div>

        <form id="checkoutForm">
          <div class="form-group"><label>Full Name *</label><input type="text" id="name" required placeholder="Abena Mensah"></div>
          <div class="form-group"><label>Email Address *</label><input type="email" id="email" required placeholder="abena@example.com"></div>
          <div class="form-group"><label>Phone / MoMo Number *</label><input type="tel" id="phone" required placeholder="0548950991"></div>
          <div class="form-group"><label>Delivery Address / Location *</label><input type="text" id="address" required placeholder="East Legon, Accra"></div>

          <div class="direct-momo-box" id="directBox">
            <h4 style="color:#b7791f; margin-bottom:0.4rem;">📥 Direct MoMo Transfer Steps:</h4>
            <p style="font-size:0.85rem; color:#4a5568;">Send the exact total amount to either MTN Mobile Money number:</p>
            <div class="momo-num">0548950991 / 0249356589</div>
            <p style="font-size:0.85rem; color:#4a5568;">Paste your MoMo Transaction ID / Reference below after sending:</p>
            <div class="form-group" style="margin-top:0.6rem;">
              <input type="text" id="momoTxId" placeholder="e.g. 2481029481">
            </div>
          </div>

          <button type="submit" class="btn" id="payBtn" style="font-size:1.1rem; padding: 1rem; margin-top:1rem;">Pay with Paystack 💳</button>
        </form>
      </div>
      <div class="cart-summary" id="orderSummary"></div>
    </div>
  </div>
  <script src="/js/checkout.js"></script>
</body>
</html>
`,

  // public/success.html
  'public/success.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Placed - Beauty Essentials</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <nav class="navbar"><a href="/" class="navbar-brand">👑 Beauty <span>Essentials</span></a></nav>
  <div class="page-container" style="max-width: 600px; text-align: center; margin-top: 3rem;">
    <div style="background: #fff; padding: 2.5rem 2rem; border-radius: 14px; box-shadow: var(--shadow);">
      <h1 style="font-size: 3.5rem; margin: 0;">🎉</h1>
      <h2 style="color: var(--primary-dark); margin: 0.5rem 0;">Thank You for Your Order!</h2>
      <p id="statusMsg" style="color: var(--gray-600);">Verifying payment...</p>

      <div id="txInfo" style="margin: 1.5rem 0; text-align: left; background: var(--pink-bg); padding: 1.2rem; border-radius: 8px; font-size: 0.9rem; line-height: 1.6; border: 1px solid var(--secondary); display:none;"></div>

      <a id="waContact" href="https://wa.me/233548950991" target="_blank" class="contact-btn" style="display:block; text-align:center; margin-top:1rem;">
        💬 WhatsApp Support (+233 548 950 991)
      </a>

      <a href="/" class="btn" style="display:block; margin-top:0.8rem; background:var(--gray-600);">Back to Shop</a>
    </div>
  </div>

  <script>
    const ref = new URLSearchParams(window.location.search).get('reference');
    if (ref) {
      fetch('/api/orders/' + ref).then(r => r.json()).then(d => {
        if (d.success) {
          localStorage.removeItem('shopwave_beauty_cart');
          const o = d.order;
          document.getElementById('statusMsg').textContent = 'Your order is confirmed and being prepared for delivery!';
          document.getElementById('txInfo').style.display = 'block';
          document.getElementById('txInfo').innerHTML = \`
            <strong>Order Reference:</strong> \${o.reference}<br>
            <strong>Amount Paid:</strong> GH₵\${Number(o.amount).toFixed(2)}<br>
            <strong>Customer:</strong> \${o.customerName}<br>
            <strong>Items:</strong> \${o.items}
          \`;
          document.getElementById('waContact').href = 'https://wa.me/233548950991?text=' + encodeURIComponent('Hi, I just completed order: ' + o.reference);
        }
      });
    }
  </script>
</body>
</html>
`,

  // public/admin.html
  'public/admin.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Beauty Essentials</title>
  <link rel="stylesheet" href="/css/styles.css">
  <style>
    .order-card { background:#fff; border-radius:10px; padding:1.2rem; margin-bottom:1rem; box-shadow:var(--shadow); border-left:6px solid var(--primary); }
    .modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); align-items:center; justify-content:center; z-index:1000; }
    .modal-content { background:#fff; padding:2rem; border-radius:12px; max-width:480px; width:90%; }
  </style>
</head>
<body>
  <nav class="navbar"><a href="/" class="navbar-brand">🛡️ Admin <span>Beauty Essentials</span></a><ul class="navbar-links"><li><a href="/" target="_blank">View Live Store</a></li></ul></nav>
  <div class="page-container">
    <div id="loginBox" style="max-width:360px; margin:4rem auto; background:#fff; padding:2rem; border-radius:12px; text-align:center; box-shadow:var(--shadow);">
      <h3>🔐 Admin Login</h3>
      <input type="password" id="pass" placeholder="Password" style="width:100%; padding:0.8rem; margin:1rem 0; border:1.5px solid var(--secondary); border-radius:6px;">
      <button class="btn" onclick="init()">Unlock Dashboard</button>
    </div>

    <div id="dash" style="display:none;">
      <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem; align-items:center;">
        <h2>📦 Beauty Orders & Deliveries</h2>
        <button class="btn" style="width:auto; padding:0.5rem 1rem; background:var(--gray-600);" onclick="loadOrders()">🔄 Refresh</button>
      </div>
      <div id="ordersList">Loading orders...</div>
    </div>
  </div>

  <script>
    let P = '';
    async function init() {
      P = document.getElementById('pass').value;
      const r = await fetch('/api/admin/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:P}) });
      const d = await r.json();
      if (!d.success) return alert('Wrong password');
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('dash').style.display = 'block';
      loadOrders();
    }

    async function loadOrders() {
      const r = await fetch('/api/admin/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:P}) });
      const d = await r.json();
      const box = document.getElementById('ordersList');
      if (!d.orders.length) return box.innerHTML = '<p>No orders yet.</p>';

      box.innerHTML = d.orders.map(o => \`
        <div class="order-card">
          <div style="display:flex; justify-content:space-between;">
            <strong>Ref: \${o.reference}</strong>
            <strong style="color:var(--primary-dark); font-size:1.15rem;">GH₵\${Number(o.amount).toFixed(2)}</strong>
          </div>
          <div style="background:var(--pink-bg); padding:0.8rem; margin:0.8rem 0; border-radius:6px; font-size:0.9rem; line-height:1.6;">
            👤 <b>Customer:</b> \${o.customerName} (\${o.customerEmail})<br>
            📞 <b>Phone:</b> <a href="https://wa.me/233\${(o.phone||'').replace(/^0/,'')}" target="_blank" style="color:#25D366; font-weight:bold;">💬 WhatsApp \${o.phone}</a><br>
            📍 <b>Location:</b> \${o.address}<br>
            🛍️ <b>Items:</b> \${o.items}
          </div>
        </div>
      \`).join('');
    }
  </script>
</body>
</html>
`,

  // public/js/app.js
  'public/js/app.js': `let products = [];
function getCart() { return JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('shopwave_beauty_cart', JSON.stringify(c)); updateB(); }
function updateB() { const el = document.getElementById('cartCount'); if(el) el.textContent = getCart().reduce((s,i)=>s+i.qty,0); }
function toast(m) { const t=document.getElementById('toast'); if(!t)return; t.textContent=m; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }

function render(l) {
  const g = document.getElementById('productsGrid'); if(!g)return;
  g.innerHTML = l.map(p => \`
    <div class="product-card">
      <img src="\${p.image}" alt="\${p.name}">
      <div class="product-info">
        <span class="product-category">\${p.category || 'Beauty'}</span>
        <h3 class="product-name">\${p.name}</h3>
        <p class="product-desc">\${p.description || ''}</p>
        <div class="product-price">GH₵\${Number(p.price).toFixed(2)}</div>
        <button class="btn" onclick="add(\${p.id})">Add to Cart 🛒</button>
      </div>
    </div>
  \`).join('');
}

function add(id) {
  const p = products.find(x => x.id === id); if(!p)return;
  const c = getCart(); const ex = c.find(x => x.id === id);
  if(ex) ex.qty += 1; else c.push({...p, qty: 1});
  saveCart(c); toast('Added ' + p.name + ' to cart!');
}

function filterCat(c, b) {
  document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  render(c === 'all' ? products : products.filter(p => p.category === c));
}

async function load() {
  products = await (await fetch('/api/products')).json();
  render(products);
  updateB();
}

document.addEventListener('DOMContentLoaded', load);
`,

  // public/js/cart.js
  'public/js/cart.js': `function getCart() { return JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('shopwave_beauty_cart', JSON.stringify(c)); render(); }
function updateQty(id, d) {
  let c = getCart(); const i = c.find(x => x.id === id);
  if(i) { i.qty += d; if(i.qty <= 0) c = c.filter(x => x.id !== id); }
  saveCart(c);
}

function render() {
  const c = getCart(), items = document.getElementById('cartItems'), sum = document.getElementById('cartSummary');
  if(!c.length) { items.innerHTML = '<p>Your cart is empty. <a href="/">Shop Essentials</a></p>'; sum.innerHTML = ''; return; }
  const tot = c.reduce((s,i)=>s+(i.price*i.qty), 0);
  items.innerHTML = c.map(i => \`
    <div style="display:flex; gap:1rem; background:#fff; padding:1rem; margin-bottom:1rem; border-radius:8px; align-items:center;">
      <img src="\${i.image}" style="width:70px; height:70px; object-fit:cover; border-radius:6px;">
      <div style="flex:1;">
        <h4>\${i.name}</h4>
        <strong style="color:var(--primary-dark);">GH₵\${Number(i.price).toFixed(2)}</strong>
      </div>
      <div>
        <button style="padding:2px 8px;" onclick="updateQty(\${i.id}, -1)">-</button>
        <span style="margin:0 8px; font-weight:bold;">\${i.qty}</span>
        <button style="padding:2px 8px;" onclick="updateQty(\${i.id}, 1)">+</button>
      </div>
    </div>
  \`).join('');
  sum.innerHTML = \`
    <h3>Order Total</h3>
    <div class="summary-row total"><span>Total</span><span>GH₵\${tot.toFixed(2)}</span></div>
    <a href="/checkout" class="btn" style="display:block; text-align:center; margin-top:1rem;">Proceed to Checkout →</a>
  \`;
}
render();
`,

  // public/js/checkout.js
  'public/js/checkout.js': `const cart = JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]');
if(!cart.length) window.location.href = '/';
const tot = cart.reduce((s,i)=>s+(i.price*i.qty), 0);
document.getElementById('orderSummary').innerHTML = '<h3>Selected Essentials</h3>' + cart.map(i => '<div class="summary-row"><span>' + i.name + ' x' + i.qty + '</span><span>GH₵' + (i.price * i.qty).toFixed(2) + '</span></div>').join('') + '<div class="summary-row total"><span>Total</span><span>GH₵' + tot.toFixed(2) + '</span></div>';

let payMethod = 'online';
window.setPayment = function(m) {
  payMethod = m;
  document.getElementById('btnOnline').className = 'pay-tab ' + (m==='online'?'active':'');
  document.getElementById('btnDirect').className = 'pay-tab ' + (m==='direct'?'active':'');
  document.getElementById('directBox').style.display = m==='direct'?'block':'none';
  document.getElementById('payBtn').textContent = m==='online'?'Pay with Paystack 💳':'Submit Direct MoMo Order ✓';
};

document.getElementById('checkoutForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('payBtn'); btn.disabled = true;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const itemsList = cart.map(i => i.name + ' (x' + i.qty + ')').join(', ');

  if (payMethod === 'online') {
    btn.textContent = 'Connecting to Paystack...';
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount: tot, metadata: { customerName: name, phone, address, itemsSummary: itemsList, cartItems: cart } })
      });
      const d = await res.json();
      if (d.status && d.data.authorization_url) window.location.href = d.data.authorization_url;
      else { alert('Payment failed'); btn.disabled = false; }
    } catch(err) { alert('Network error'); btn.disabled = false; }
  } else {
    const txId = document.getElementById('momoTxId').value.trim();
    if (!txId) return alert('Enter MoMo Transaction ID');
    btn.textContent = 'Submitting order...';
    try {
      const res = await fetch('/api/payment/direct-momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address, transactionId: txId, amount: tot, itemsSummary: itemsList })
      });
      const d = await res.json();
      if (d.success) window.location.href = '/success?reference=' + encodeURIComponent(txId);
      else { alert('Submission failed'); btn.disabled = false; }
    } catch(err) { alert('Error submitting'); btn.disabled = false; }
  }
};
`
};

for (const [filePath, content] of Object.entries(files)) {
  const dest = path.join(root, filePath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  console.log('Created: ' + filePath);
}
console.log('\n========================================');
console.log('✅ BEAUTY ESSENTIALS SHOP GENERATED!');
console.log('========================================\n');
try { execSync(`explorer "${root}"`); } catch(e){}