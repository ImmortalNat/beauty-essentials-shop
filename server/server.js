require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Force PostgreSQL to return BIGINT and NUMERIC columns as JavaScript Numbers
pg.types.setTypeParser(20, val => parseInt(val, 10));
pg.types.setTypeParser(1700, val => parseFloat(val));

const { Pool } = pg;

// PostgreSQL Connection Setup
const DATABASE_URL = (process.env.DATABASE_URL || '').trim();
let pool = null;

if (DATABASE_URL && !DATABASE_URL.includes('YOUR_')) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('🐘 PostgreSQL Pool configured for Beauty Essentials!');
} else {
  console.log('⚠️ WARNING: DATABASE_URL is missing in Environment Variables!');
}

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Lip Gloss", price: 25, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Shiny, non-sticky high-shine lip gloss." },
  { id: 2, name: "Head Band (Soft Fleece)", price: 20, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", description: "Cute plush spa headbands for skincare and makeup." },
  { id: 3, name: "Lipstick Set", price: 35, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Richly pigmented smooth matte lipstick shades." },
  { id: 4, name: "Pearl Hair Clips", price: 15, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Elegant pearl-decorated hair pins." },
  { id: 5, name: "Edges Control Cream", price: 30, category: "Hair Care", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400", description: "Strong hold edge control for sleek hairline styling." },
  { id: 6, name: "Resell & Glow Starter Package", price: 150, category: "Resell Bundles", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400", description: "Wholesale beauty bundle to start your resell business." }
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
  momoName: "Mary Appiah / Beauty Essentials",
  supportEmail: "orders@beautyessentials.com",
  shopAddress: "Accra, Ghana"
};

function getJson(file, def) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); } catch (e) {}
  return def;
}

function saveJson(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) {}
}

// Auto-Initialize Postgres Tables for Beauty Essentials
async function initDb() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT PRIMARY KEY,
        name TEXT, price NUMERIC, category TEXT, image TEXT, description TEXT
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        data JSONB
      );
      CREATE TABLE IF NOT EXISTS orders (
        reference TEXT PRIMARY KEY,
        amount NUMERIC, customer_email TEXT, customer_name TEXT,
        phone TEXT, address TEXT, items TEXT, status TEXT,
        delivery_note TEXT, is_direct_momo BOOLEAN, paid_at TEXT
      );
    `);

    const pCheck = await pool.query('SELECT COUNT(*) FROM products');
    if (Number(pCheck.rows[0].count) === 0) {
      for (const p of DEFAULT_PRODUCTS) {
        await pool.query(
          `INSERT INTO products (id, name, price, category, image, description)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [p.id, p.name, p.price, p.category, p.image, p.description || '']
        );
      }
    }

    const sCheck = await pool.query('SELECT COUNT(*) FROM settings');
    if (Number(sCheck.rows[0].count) === 0) {
      await pool.query(`INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT DO NOTHING`, [JSON.stringify(DEFAULT_SETTINGS)]);
    }
    console.log('✅ Beauty Essentials PostgreSQL Tables Ready!');
  } catch (err) {
    console.error('❌ DB Init Error:', err.message);
  }
}

initDb();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// No-Cache Middleware
function noCache(req, res, next) {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
}

// Diagnostic Endpoint
app.get('/api/db-check', async (req, res) => {
  if (!pool) return res.json({ connected: false, reason: 'DATABASE_URL is missing' });
  try {
    const q = await pool.query('SELECT COUNT(*) FROM products');
    res.json({ connected: true, message: 'Beauty Essentials PostgreSQL Database is Live! 🐘', productCount: Number(q.rows[0].count) });
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

app.get('/api/products', noCache, async (req, res) => {
  if (pool) {
    try {
      const q = await pool.query('SELECT id, name, price, category, image, description FROM products ORDER BY id DESC');
      if (q.rows.length) return res.json(q.rows);
    } catch(e) {}
  }
  res.json(getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS));
});

app.get('/api/settings', noCache, async (req, res) => {
  if (pool) {
    try {
      const q = await pool.query('SELECT data FROM settings WHERE id = 1');
      if (q.rows.length) return res.json(q.rows[0].data);
    } catch(e) {}
  }
  res.json(getJson(SETTINGS_FILE, DEFAULT_SETTINGS));
});

// Track order lookup
app.get('/api/orders/:ref', noCache, async (req, res) => {
  const ref = (req.params.ref || '').trim();
  let order = null;

  if (pool) {
    try {
      const q = await pool.query('SELECT reference, amount, customer_email AS "customerEmail", customer_name AS "customerName", phone, address, items, status, delivery_note AS "deliveryNote", is_direct_momo AS "isDirectMomo", paid_at AS "paidAt" FROM orders WHERE LOWER(reference) = LOWER($1)', [ref]);
      order = q.rows[0];
    } catch(e) {}
  }

  if (!order) {
    const orders = getJson(ORDERS_FILE, []);
    order = orders.find(o => o.reference && o.reference.toLowerCase() === ref.toLowerCase());
  }

  if (order) return res.json({ success: true, order });
  res.status(404).json({ success: false, message: 'Order not found' });
});

// Direct MoMo Checkout Endpoint
app.post('/api/payment/direct-momo', async (req, res) => {
  const { name, email, phone, address, transactionId, amount, itemsSummary } = req.body;
  if (!name || !phone || !transactionId || !amount) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const ref = String(transactionId).trim();
  const newOrder = {
    reference: ref,
    amount: Number(amount),
    customerEmail: email || 'N/A',
    customerName: name,
    phone: phone,
    address: address || 'Accra, Ghana',
    items: itemsSummary || 'Beauty order',
    status: 'Awaiting MoMo Verification',
    deliveryNote: 'Order received. Waiting for MoMo payment verification.',
    isDirectMomo: true,
    paidAt: new Date().toISOString()
  };

  if (pool) {
    try {
      await pool.query(`
        INSERT INTO orders (reference, amount, customer_email, customer_name, phone, address, items, status, delivery_note, is_direct_momo, paid_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (reference) DO NOTHING
      `, [ref, newOrder.amount, newOrder.customerEmail, newOrder.customerName, newOrder.phone, newOrder.address, newOrder.items, newOrder.status, newOrder.deliveryNote, true, newOrder.paidAt]);
    } catch(e) {}
  }

  let orders = getJson(ORDERS_FILE, []);
  if (!orders.find(o => o.reference.toLowerCase() === ref.toLowerCase())) {
    orders.push(newOrder);
    saveJson(ORDERS_FILE, orders);
  }

  res.json({ success: true, reference: ref });
});

function verifyAdmin(req, res, next) {
  if (req.body.password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
    return res.status(401).json({ success: false, message: 'Wrong password' });
  }
  next();
}

app.post('/api/admin/orders', verifyAdmin, async (req, res) => {
  if (pool) {
    try {
      const q = await pool.query('SELECT reference, amount, customer_email AS "customerEmail", customer_name AS "customerName", phone, address, items, status, delivery_note AS "deliveryNote", is_direct_momo AS "isDirectMomo", paid_at AS "paidAt" FROM orders ORDER BY paid_at DESC');
      return res.json({ success: true, orders: q.rows });
    } catch(e) {}
  }
  res.json({ success: true, orders: getJson(ORDERS_FILE, []).reverse() });
});

app.post('/api/admin/update-progress', verifyAdmin, async (req, res) => {
  const { reference, status, deliveryNote } = req.body;
  const ref = String(reference || '').trim();

  if (pool) {
    try {
      await pool.query('UPDATE orders SET status = $1, delivery_note = $2 WHERE LOWER(reference) = LOWER($3)', [status, deliveryNote || '', ref]);
    } catch(e) {}
  }

  let orders = getJson(ORDERS_FILE, []);
  let order = orders.find(o => o.reference && o.reference.toLowerCase() === ref.toLowerCase());
  if (order) {
    order.status = status || order.status;
    order.deliveryNote = deliveryNote || '';
    saveJson(ORDERS_FILE, orders);
  }

  res.json({ success: true, message: 'Order progress updated' });
});

app.post('/api/admin/products/save', verifyAdmin, async (req, res) => {
  const p = req.body.product;
  const prodId = p.id ? Number(p.id) : Date.now();

  if (pool) {
    try {
      await pool.query(`
        INSERT INTO products (id, name, price, category, image, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category,
          image = EXCLUDED.image, description = EXCLUDED.description
      `, [prodId, p.name, Number(p.price), p.category, p.image, p.description || '']);
    } catch(e) {}
  }

  let products = getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  if (p.id) {
    const i = products.findIndex(x => x.id === Number(p.id));
    if (i !== -1) products[i] = { ...products[i], id: prodId, name: p.name, price: Number(p.price), category: p.category, image: p.image, description: p.description || '' };
  } else {
    products.push({ id: prodId, name: p.name, price: Number(p.price), category: p.category, image: p.image, description: p.description || '' });
  }
  saveJson(PRODUCTS_FILE, products);

  res.json({ success: true });
});

app.post('/api/admin/products/delete', verifyAdmin, async (req, res) => {
  const pId = Number(req.body.productId);
  if (pool) {
    try { await pool.query('DELETE FROM products WHERE id = $1', [pId]); } catch(e) {}
  }
  saveJson(PRODUCTS_FILE, getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS).filter(p => p.id !== pId));
  res.json({ success: true });
});

app.post('/api/admin/settings/save', verifyAdmin, async (req, res) => {
  const s = req.body.settings;
  if (pool) {
    try {
      await pool.query('INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data', [JSON.stringify(s)]);
    } catch(e) {}
  }
  saveJson(SETTINGS_FILE, { ...getJson(SETTINGS_FILE, DEFAULT_SETTINGS), ...s });
  res.json({ success: true });
});

// Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get(['/cart', '/cart.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cart.html')));
app.get(['/checkout', '/checkout.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html')));
app.get(['/success', '/success.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'success.html')));
app.get(['/admin', '/admin.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));

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
