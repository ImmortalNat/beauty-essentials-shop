require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Lip Gloss", price: 25, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Shiny, non-sticky high-shine lip gloss." },
  { id: 2, name: "Head Band (Soft Fleece)", price: 20, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", description: "Cute plush spa headbands for skincare and makeup." },
  { id: 3, name: "Lipstick Set", price: 35, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Richly pigmented smooth matte lipstick shades." },
  { id: 4, name: "Pearl Hair Clips", price: 15, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Elegant pearl-decorated hair pins." },
  { id: 5, name: "Edges Control Cream", price: 30, category: "Hair Care", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400", description: "Strong hold edge control for sleek hairline styling." },
  { id: 6, name: "Resell & Glow Starter Package", price: 150, category: "Resell Bundles", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400", description: "Wholesale beauty bundle to start your resell business." },
  { id: 7, name: "Hair Pins Pack", price: 10, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Durable metallic bobby pins." },
  { id: 8, name: "Styling Hair Comb Set", price: 15, category: "Hair Tools", image: "https://images.unsplash.com/photo-1590540179852-2110a54f813a?w=400", description: "Wide-tooth and rat-tail styling combs." },
  { id: 9, name: "Butterfly Hair Clips", price: 18, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Trendy butterfly clips for a chic look." },
  { id: 10, name: "Matte Claw Clips", price: 20, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Strong grip claw clips for bun hairstyles." },
  { id: 11, name: "Hair Bonds / Bands", price: 12, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Soft seamless hair ties that won't break hair." },
  { id: 12, name: "Cute Beaded Bracelets", price: 25, category: "Jewelry", image: "https://images.unsplash.com/photo-1611591475168-a40552ebdbdb?w=400", description: "Stackable pastel beaded charm bracelets." },
  { id: 13, name: "Gold Ring Stacks", price: 30, category: "Jewelry", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400", description: "Trendy multi-piece ring stack set." }
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
  momoName: "Beauty Essentials",
  supportEmail: "orders@beautyessentials.com",
  shopAddress: "Accra, Ghana"
};

function getJson(file, def) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  } catch (e) {}
  return def;
}

function saveJson(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) {}
}

if (!fs.existsSync(PRODUCTS_FILE)) saveJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
if (!fs.existsSync(SETTINGS_FILE)) saveJson(SETTINGS_FILE, DEFAULT_SETTINGS);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/products', (req, res) => res.json(getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS)));
app.get('/api/settings', (req, res) => res.json(getJson(SETTINGS_FILE, DEFAULT_SETTINGS)));

// Track order lookup
app.get('/api/orders/:ref', (req, res) => {
  const ref = (req.params.ref || '').trim();
  const orders = getJson(ORDERS_FILE, []);
  const order = orders.find(o => o.reference && o.reference.toLowerCase() === ref.toLowerCase());
  if (order) return res.json({ success: true, order });
  res.status(404).json({ success: false, message: 'Order not found' });
});

// Direct MoMo only checkout
app.post('/api/payment/direct-momo', (req, res) => {
  const { name, email, phone, address, transactionId, amount, itemsSummary, cartItems } = req.body;
  if (!name || !phone || !transactionId || !amount) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields including MoMo Transaction ID.' });
  }

  const orders = getJson(ORDERS_FILE, []);
  const newOrder = {
    reference: String(transactionId).trim(),
    amount: Number(amount),
    customerEmail: email || 'N/A',
    customerName: name,
    phone: phone,
    address: address || 'Accra, Ghana',
    items: itemsSummary || 'Beauty order',
    cartItems: cartItems || [],
    status: 'Awaiting MoMo Verification',
    deliveryNote: 'Order received. Waiting for MoMo payment verification.',
    paidAt: new Date().toISOString()
  };

  // Avoid duplicate refs
  const exists = orders.find(o => o.reference.toLowerCase() === newOrder.reference.toLowerCase());
  if (!exists) {
    orders.push(newOrder);
    saveJson(ORDERS_FILE, orders);
  }

  res.json({ success: true, reference: newOrder.reference });
});

function verifyAdmin(req, res, next) {
  if (req.body.password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
    return res.status(401).json({ success: false, message: 'Wrong password' });
  }
  next();
}

app.post('/api/admin/orders', verifyAdmin, (req, res) => {
  res.json({ success: true, orders: getJson(ORDERS_FILE, []).reverse() });
});

app.post('/api/admin/update-progress', verifyAdmin, (req, res) => {
  const { reference, status, deliveryNote } = req.body;
  const orders = getJson(ORDERS_FILE, []);
  const order = orders.find(o => o.reference && o.reference.toLowerCase() === String(reference || '').toLowerCase());
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.status = status || order.status;
  order.deliveryNote = deliveryNote || order.deliveryNote || '';
  order.updatedAt = new Date().toISOString();
  saveJson(ORDERS_FILE, orders);
  res.json({ success: true, message: 'Order progress updated' });
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
  const products = getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS).filter(p => p.id !== Number(req.body.productId));
  saveJson(PRODUCTS_FILE, products);
  res.json({ success: true });
});

app.post('/api/admin/settings/save', verifyAdmin, (req, res) => {
  const current = getJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  saveJson(SETTINGS_FILE, { ...current, ...req.body.settings });
  res.json({ success: true });
});

// Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get(['/cart', '/cart.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cart.html')));
app.get(['/checkout', '/checkout.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html')));
app.get(['/success', '/success.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'success.html')));
app.get(['/admin', '/admin.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));

// Track page ALWAYS works (no Not Found)
app.get(['/track', '/track.html'], (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Track Order - Beauty Essentials</title>
  <link rel="stylesheet" href="/css/styles.css">
  <style>
    .timeline{margin:2rem 0;text-align:left}.step{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}
    .circle{width:34px;height:34px;border-radius:50%;background:#dee2e6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold}
    .circle.active{background:#ff4d8d}.circle.done{background:#10b981}
    .note{background:#fff0f5;border-left:5px solid #ff4d8d;padding:1rem;border-radius:8px;margin:1rem 0;text-align:left}
  </style>
</head>
<body>
  <nav class="navbar"><a href="/" class="navbar-brand">👑 Beauty <span>Essentials</span></a><ul class="navbar-links"><li><a href="/">Home</a></li></ul></nav>
  <div class="page-container" style="max-width:600px;margin-top:2.5rem;text-align:center">
    <div style="background:#fff;padding:2rem;border-radius:14px;box-shadow:0 4px 20px rgba(255,77,141,0.12)">
      <h2>📦 Track Your Order</h2>
      <p style="color:#6c757d;margin:0.5rem 0 1.2rem">Enter your MoMo Transaction ID / Order Reference</p>
      <form id="f" style="display:flex;gap:0.5rem;margin-bottom:1.2rem">
        <input id="ref" required placeholder="e.g. 2481029481" style="flex:1;padding:0.8rem;border:1.5px solid #f472b6;border-radius:8px">
        <button class="btn" style="width:auto;padding:0.8rem 1.2rem">Track</button>
      </form>
      <div id="res" style="display:none;text-align:left">
        <h3 id="st" style="color:#d62865"></h3>
        <div class="note" id="note"></div>
        <div id="details" style="background:#fff5f8;padding:1rem;border-radius:8px;font-size:0.92rem;line-height:1.6"></div>
        <div class="timeline">
          <div class="step"><div class="circle done" id="s1">✓</div><div><strong>1. Order Received</strong></div></div>
          <div class="step"><div class="circle" id="s2">2</div><div><strong>2. MoMo Verified / Packaging</strong></div></div>
          <div class="step"><div class="circle" id="s3">3</div><div><strong>3. Out for Delivery</strong></div></div>
          <div class="step"><div class="circle" id="s4">4</div><div><strong>4. Delivered</strong></div></div>
        </div>
        <a id="wa" target="_blank" class="btn" style="display:block;text-align:center;background:#25D366;margin-top:1rem;text-decoration:none">💬 WhatsApp Support</a>
      </div>
    </div>
  </div>
  <script>
    document.getElementById('f').onsubmit = async (e) => {
      e.preventDefault();
      const r = document.getElementById('ref').value.trim();
      const box = document.getElementById('res');
      box.style.display = 'block';
      document.getElementById('st').textContent = 'Searching...';
      try {
        const res = await fetch('/api/orders/' + encodeURIComponent(r));
        const data = await res.json();
        if (!data.success) {
          document.getElementById('st').innerHTML = '<span style="color:red">❌ Order not found</span>';
          document.getElementById('note').innerHTML = 'If you just paid by MoMo, WhatsApp us with your Transaction ID screenshot.';
          document.getElementById('details').innerHTML = '';
          document.getElementById('wa').href = 'https://wa.me/233548950991?text=' + encodeURIComponent('Hi, I paid and need help tracking. Tx ID: ' + r);
          return;
        }
        const o = data.order;
        document.getElementById('st').textContent = 'Status: ' + o.status;
        document.getElementById('note').innerHTML = '<strong>Latest update:</strong><br>' + (o.deliveryNote || 'Order received.');
        document.getElementById('details').innerHTML =
          '<strong>Reference:</strong> ' + o.reference +
          '<br><strong>Customer:</strong> ' + o.customerName +
          '<br><strong>Phone:</strong> ' + o.phone +
          '<br><strong>Amount:</strong> GH₵' + Number(o.amount).toFixed(2) +
          '<br><strong>Address:</strong> ' + (o.address || 'N/A') +
          '<br><strong>Items:</strong> ' + o.items;

        ['s1','s2','s3','s4'].forEach(id => document.getElementById(id).className = 'circle');
        document.getElementById('s1').className = 'circle done';
        if (o.status === 'Awaiting MoMo Verification' || o.status === 'Packaging') document.getElementById('s2').className = 'circle active';
        if (o.status === 'Out for Delivery') { document.getElementById('s2').className = 'circle done'; document.getElementById('s3').className = 'circle active'; }
        if (o.status === 'Delivered') { document.getElementById('s2').className = 'circle done'; document.getElementById('s3').className = 'circle done'; document.getElementById('s4').className = 'circle done'; }

        document.getElementById('wa').href = 'https://wa.me/233548950991?text=' + encodeURIComponent('Hi, checking my order: ' + o.reference);
      } catch (err) {
        document.getElementById('st').innerHTML = '<span style="color:red">❌ Connection error</span>';
      }
    };
    const q = new URLSearchParams(location.search).get('ref');
    if (q) { document.getElementById('ref').value = q; document.getElementById('f').dispatchEvent(new Event('submit')); }
  </script>
</body>
</html>`);
});

app.listen(PORT, () => console.log('Beauty Essentials live on port ' + PORT));
module.exports = app;
