require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

pg.types.setTypeParser(20, val => parseInt(val, 10));
pg.types.setTypeParser(1700, val => parseFloat(val));
const { Pool } = pg;

const DATABASE_URL = (process.env.DATABASE_URL || '').trim();
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  console.log('🐘 PostgreSQL connected for Beauty Essentials!');
}

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');
const DELIVERY_FILE = path.join(__dirname, 'delivery.json');

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Lips", icon: "💋" },
  { id: 2, name: "Hair Accessories", icon: "🎀" },
  { id: 3, name: "Hair Care", icon: "💇‍♀️" },
  { id: 4, name: "Hair Tools", icon: "💈" },
  { id: 5, name: "Resell Bundles", icon: "🛍️" },
  { id: 6, name: "Jewelry", icon: "💍" }
];

// Complete 16-Region Ghana Delivery Database
const DEFAULT_DELIVERY = [
  // 1. Greater Accra Region
  { id: 1, region: "Greater Accra", town: "East Legon / Shiashie / Bawaleshie", fee: 25 },
  { id: 2, region: "Greater Accra", town: "Madina / Adenta / Abokobi", fee: 30 },
  { id: 3, region: "Greater Accra", town: "Circle / Osu / Ridge / Cantonments", fee: 20 },
  { id: 4, region: "Greater Accra", town: "Spintex / Teshie / Nungua", fee: 30 },
  { id: 5, region: "Greater Accra", town: "Dansoman / Kaneshie / Lapaz / Achimota", fee: 25 },
  { id: 6, region: "Greater Accra", town: "Tema / Ashaiman / Dawhenya / Prampram", fee: 40 },
  { id: 7, region: "Greater Accra", town: "Kasoa / Weija / Mallam / Bortianor", fee: 35 },
  { id: 8, region: "Greater Accra", town: "Legon Campus / UPSA / Haatso", fee: 20 },

  // 2. Ashanti Region
  { id: 9, region: "Ashanti", town: "Kumasi Central (Adum / Asafo / Kejetia)", fee: 45 },
  { id: 10, region: "Ashanti", town: "KNUST / Ayigya / Ayeduase / Kentinkrono", fee: 50 },
  { id: 11, region: "Ashanti", town: "Bantama / Suame / Suntreso / Abrepo", fee: 45 },
  { id: 12, region: "Ashanti", town: "Tafo / Pankrono / Alabar / Mamponteng", fee: 50 },
  { id: 13, region: "Ashanti", town: "Asokwa / Ahodwo / Nhyiaeso", fee: 45 },
  { id: 14, region: "Ashanti", town: "Ejisu / Mampong / Offinso", fee: 55 },
  { id: 15, region: "Ashanti", town: "Obuasi / Bekwai", fee: 60 },

  // 3. Western Region
  { id: 16, region: "Western", town: "Sekondi-Takoradi Central (Market Circle)", fee: 55 },
  { id: 17, region: "Western", town: "Effia / Kwesimintsim / Fijai", fee: 55 },
  { id: 18, region: "Western", town: "Tarkwa / UMaT Campus", fee: 60 },
  { id: 19, region: "Western", town: "Axim / Elubo", fee: 65 },

  // 4. Central Region
  { id: 20, region: "Central", town: "Cape Coast / UCC Campus / Pedu", fee: 50 },
  { id: 21, region: "Central", town: "Elmina / Komenda", fee: 55 },
  { id: 22, region: "Central", town: "Winneba / UEW Campus", fee: 45 },
  { id: 23, region: "Central", town: "Mankessim / Agona Swedru", fee: 50 },

  // 5. Eastern Region
  { id: 24, region: "Eastern", town: "Koforidua Central / Effiduase", fee: 45 },
  { id: 25, region: "Eastern", town: "Nsawam / Aburi / Larteh", fee: 40 },
  { id: 26, region: "Eastern", town: "Suhum / Nkawkaw", fee: 50 },
  { id: 27, region: "Eastern", town: "Akosombo / Somanya / Oda", fee: 55 },

  // 6. Volta Region
  { id: 28, region: "Volta", town: "Ho Central / UHAS Campus", fee: 50 },
  { id: 29, region: "Volta", town: "Hohoe / Kpando", fee: 55 },
  { id: 30, region: "Volta", town: "Aflao / Sogakope / Anloga", fee: 60 },

  // 7. Northern Region
  { id: 31, region: "Northern", town: "Tamale Central / UDS Campus", fee: 65 },
  { id: 32, region: "Northern", town: "Savelugu / Yendi", fee: 70 },

  // 8. Upper East Region
  { id: 33, region: "Upper East", town: "Bolgatanga Central", fee: 70 },
  { id: 34, region: "Upper East", town: "Navrongo / Bawku", fee: 75 },

  // 9. Upper West Region
  { id: 35, region: "Upper West", town: "Wa Central / UDS Wa", fee: 70 },
  { id: 36, region: "Upper West", town: "Jirapa / Lawra", fee: 75 },

  // 10. Bono Region
  { id: 37, region: "Bono", town: "Sunyani Central / Fiapre", fee: 60 },
  { id: 38, region: "Bono", town: "Berekum / Dormaa Ahenkro", fee: 65 },

  // 11. Bono East Region
  { id: 39, region: "Bono East", town: "Techiman Central", fee: 60 },
  { id: 40, region: "Bono East", town: "Kintampo / Atebubu", fee: 65 },

  // 12. Ahafo Region
  { id: 41, region: "Ahafo", town: "Goaso / Mim / Kenyasi", fee: 65 },

  // 13. Oti Region
  { id: 42, region: "Oti", town: "Dambai / Jasikan / Nkwanta", fee: 65 },

  // 14. Savannah Region
  { id: 43, region: "Savannah", town: "Damongo / Salaga / Buipe", fee: 70 },

  // 15. North East Region
  { id: 44, region: "North East", town: "Nalerigu / Walewale", fee: 70 },

  // 16. Western North Region
  { id: 45, region: "Western North", town: "Sefwi Wiawso / Bibiani / Enchi", fee: 65 }
];

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Lip Gloss", price: 25, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Shiny, non-sticky high-shine lip gloss." },
  { id: 2, name: "Head Band (Soft Fleece)", price: 20, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", description: "Cute plush spa headbands for skincare and makeup." },
  { id: 3, name: "Lipstick Set", price: 35, category: "Lips", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400", description: "Richly pigmented smooth matte lipstick shades." },
  { id: 4, name: "Pearl Hair Clips", price: 15, category: "Hair Accessories", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400", description: "Elegant pearl-decorated hair pins." },
  { id: 5, name: "Edges Control Cream", price: 30, category: "Hair Care", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400", description: "Strong hold edge control for sleek hairline styling." },
  { id: 6, name: "Resell & Glow Starter Package", price: 150, category: "Resell Bundles", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400", description: "Wholesale beauty bundle to start your resell business." }
];

const DEFAULT_SETTINGS = {
  storeName: "Beauty Essentials", tagline: "CUTE. STYLISH. YOU.", announcement: "⚡ RESELL & GLOW! Everything you need to look good & slay every day! ♥", heroTitle: "Your Beauty Essentials Spot ♥", heroSubtitle: "Trendy & affordable beauty accessories, lip glosses, hair clips & resell bundles.", whatsappNumber: "233548950991", supportPhone1: "0548950991", supportPhone2: "0249356589", momoName: "Mary Appiah / Beauty Essentials", supportEmail: "orders@beautyessentials.com", shopAddress: "Accra, Ghana"
};

function getJson(file, def) { try { if(fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')||'[]'); }catch(e){} return def; }
function saveJson(file, data) { try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }catch(e){} }

async function initDb() {
  if(!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (id BIGINT PRIMARY KEY, name TEXT, price NUMERIC, category TEXT, image TEXT, description TEXT);
      CREATE TABLE IF NOT EXISTS categories (id BIGINT PRIMARY KEY, name TEXT, icon TEXT);
      CREATE TABLE IF NOT EXISTS delivery (id BIGINT PRIMARY KEY, region TEXT, town TEXT, fee NUMERIC);
      CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY DEFAULT 1, data JSONB);
      CREATE TABLE IF NOT EXISTS orders (reference TEXT PRIMARY KEY, amount NUMERIC, customer_email TEXT, customer_name TEXT, phone TEXT, address TEXT, items TEXT, status TEXT, delivery_note TEXT, is_direct_momo BOOLEAN, paid_at TEXT);
    `);

    if (Number((await pool.query('SELECT COUNT(*) FROM products')).rows[0].count) === 0) {
      for (const p of DEFAULT_PRODUCTS) await pool.query('INSERT INTO products (id, name, price, category, image, description) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING', [p.id, p.name, p.price, p.category, p.image, p.description||'']);
    }
    if (Number((await pool.query('SELECT COUNT(*) FROM categories')).rows[0].count) === 0) {
      for (const c of DEFAULT_CATEGORIES) await pool.query('INSERT INTO categories (id, name, icon) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [c.id, c.name, c.icon]);
    }
    
    // Refresh delivery locations to ensure all 16 regions exist in DB
    const delCount = Number((await pool.query('SELECT COUNT(*) FROM delivery')).rows[0].count);
    if (delCount < 30) {
      for (const d of DEFAULT_DELIVERY) {
        await pool.query('INSERT INTO delivery (id, region, town, fee) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET region=EXCLUDED.region, town=EXCLUDED.town, fee=EXCLUDED.fee', [d.id, d.region, d.town, d.fee]);
      }
    }

    if (Number((await pool.query('SELECT COUNT(*) FROM settings')).rows[0].count) === 0) {
      await pool.query('INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT DO NOTHING', [JSON.stringify(DEFAULT_SETTINGS)]);
    }
  } catch(e){ console.error('DB Init Error:', e.message); }
}
initDb();

app.use(cors());
app.use(express.json({ limit:'50mb' }));
app.use(express.urlencoded({ limit:'50mb', extended:true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
function noCache(req,res,next){res.header('Cache-Control','no-cache,no-store,must-revalidate');res.header('Pragma','no-cache');res.header('Expires','0');next();}

// Public APIs
app.get('/api/categories', noCache, async (req, res) => {
  if (pool) { try { const q = await pool.query('SELECT * FROM categories ORDER BY id ASC'); if (q.rows.length) return res.json(q.rows); } catch(e){} }
  res.json(getJson(CATEGORIES_FILE, DEFAULT_CATEGORIES));
});

app.get('/api/delivery', noCache, async (req, res) => {
  if (pool) { try { const q = await pool.query('SELECT id, region, town, fee FROM delivery ORDER BY region ASC, town ASC'); if (q.rows.length) return res.json(q.rows); } catch(e){} }
  res.json(getJson(DELIVERY_FILE, DEFAULT_DELIVERY));
});

app.get('/api/products', noCache, async (req, res) => {
  if (pool) { try { const q = await pool.query('SELECT id, name, price, category, image, description FROM products ORDER BY id DESC'); if (q.rows.length) return res.json(q.rows); } catch(e){} }
  res.json(getJson(PRODUCTS_FILE, DEFAULT_PRODUCTS));
});

app.get('/api/settings', noCache, async (req, res) => {
  if (pool) { try { const q = await pool.query('SELECT data FROM settings WHERE id = 1'); if (q.rows.length) return res.json(q.rows[0].data); } catch(e){} }
  res.json(getJson(SETTINGS_FILE, DEFAULT_SETTINGS));
});

app.get('/api/orders/:ref', noCache, async (req, res) => {
  const ref = (req.params.ref || '').trim();
  if (pool) { try { const q = await pool.query('SELECT * FROM orders WHERE LOWER(reference)=LOWER($1)', [ref]); if (q.rows[0]) return res.json({ success: true, order: q.rows[0] }); } catch(e){} }
  const order = getJson(ORDERS_FILE, []).find(o => o.reference && o.reference.toLowerCase() === ref.toLowerCase());
  if (order) return res.json({ success: true, order });
  res.status(404).json({ success: false });
});

// Direct MoMo Checkout
app.post('/api/payment/direct-momo', async (req, res) => {
  const { name, email, phone, address, transactionId, amount, itemsSummary } = req.body;
  if (!name || !phone || !transactionId || !amount) return res.status(400).json({ success: false, message: 'Missing fields' });
  const newOrder = { reference: String(transactionId).trim(), amount: Number(amount), customer_email: email||'N/A', customer_name: name, phone, address: address||'Accra', items: itemsSummary, status: 'Awaiting MoMo Verification', delivery_note: 'Awaiting payment verification.', is_direct_momo: true, paid_at: new Date().toISOString() };
  if (pool) { try { await pool.query('INSERT INTO orders (reference, amount, customer_email, customer_name, phone, address, items, status, delivery_note, is_direct_momo, paid_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING', [newOrder.reference, newOrder.amount, newOrder.customer_email, newOrder.customer_name, newOrder.phone, newOrder.address, newOrder.items, newOrder.status, newOrder.delivery_note, true, newOrder.paid_at]); } catch(e){} }
  let orders = getJson(ORDERS_FILE, []);
  if (!orders.find(o => o.reference.toLowerCase() === newOrder.reference.toLowerCase())) { orders.push({ ...newOrder, customerEmail: newOrder.customer_email, customerName: newOrder.customer_name }); saveJson(ORDERS_FILE, orders); }
  res.json({ success: true, reference: newOrder.reference });
});

// Admin
function verifyAdmin(req, res, next) { if (req.body.password !== (process.env.ADMIN_PASSWORD || 'admin123')) return res.status(401).json({ success: false }); next(); }

app.post('/api/admin/orders', verifyAdmin, async (req, res) => {
  if (pool) { try { const q = await pool.query('SELECT reference, amount, customer_email AS "customerEmail", customer_name AS "customerName", phone, address, items, status, delivery_note AS "deliveryNote", paid_at AS "paidAt" FROM orders ORDER BY paid_at DESC'); return res.json({ success: true, orders: q.rows }); } catch(e){} }
  res.json({ success: true, orders: getJson(ORDERS_FILE, []).reverse() });
});

app.post('/api/admin/update-progress', verifyAdmin, async (req, res) => {
  const { reference, status, deliveryNote } = req.body;
  if (pool) { try { await pool.query('UPDATE orders SET status=$1, delivery_note=$2 WHERE LOWER(reference)=LOWER($3)', [status, deliveryNote||'', String(reference).trim()]); } catch(e){} }
  let orders = getJson(ORDERS_FILE, []); const order = orders.find(o => o.reference && o.reference.toLowerCase() === String(reference).trim().toLowerCase());
  if (order) { order.status = status; order.deliveryNote = deliveryNote || ''; saveJson(ORDERS_FILE, orders); }
  res.json({ success: true });
});

app.post('/api/admin/categories/save', verifyAdmin, async (req, res) => {
  const c = req.body.category; const cId = c.id ? Number(c.id) : Date.now();
  if (pool) { try { await pool.query('INSERT INTO categories (id, name, icon) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, icon=EXCLUDED.icon', [cId, c.name.trim(), c.icon||'🛍️']); } catch(e){} }
  res.json({ success: true });
});

app.post('/api/admin/categories/delete', verifyAdmin, async (req, res) => {
  if (pool) { try { await pool.query('DELETE FROM categories WHERE id=$1', [Number(req.body.categoryId)]); } catch(e){} }
  res.json({ success: true });
});

app.post('/api/admin/delivery/save', verifyAdmin, async (req, res) => {
  const loc = req.body.loc; const id = loc.id ? Number(loc.id) : Date.now();
  if (pool) { try { await pool.query('INSERT INTO delivery (id, region, town, fee) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET region=EXCLUDED.region, town=EXCLUDED.town, fee=EXCLUDED.fee', [id, loc.region.trim(), loc.town.trim(), Number(loc.fee)]); } catch(e){} }
  res.json({ success: true });
});

app.post('/api/admin/delivery/delete', verifyAdmin, async (req, res) => {
  if (pool) { try { await pool.query('DELETE FROM delivery WHERE id=$1', [Number(req.body.id)]); } catch(e){} }
  res.json({ success: true });
});

app.post('/api/admin/products/save', verifyAdmin, async (req, res) => {
  const p = req.body.product; const prodId = p.id ? Number(p.id) : Date.now();
  if (pool) { try { await pool.query('INSERT INTO products (id, name, price, category, image, description) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, price=EXCLUDED.price, category=EXCLUDED.category, image=EXCLUDED.image, description=EXCLUDED.description', [prodId, p.name, Number(p.price), p.category, p.image, p.description||'']); } catch(e){} }
  res.json({ success: true });
});

app.post('/api/admin/products/delete', verifyAdmin, async (req, res) => {
  if (pool) { try { await pool.query('DELETE FROM products WHERE id=$1', [Number(req.body.productId)]); } catch(e){} }
  res.json({ success: true });
});

app.post('/api/admin/settings/save', verifyAdmin, async (req, res) => {
  const s = req.body.settings;
  if (pool) { try { await pool.query('INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data', [JSON.stringify(s)]); } catch(e){} }
  res.json({ success: true });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get(['/cart', '/cart.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cart.html')));
app.get(['/checkout', '/checkout.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html')));
app.get(['/success', '/success.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'success.html')));
app.get(['/admin', '/admin.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));
app.get(['/track', '/track.html'], (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Track Order - Beauty Essentials</title><link rel="stylesheet" href="/css/styles.css"><style>.timeline{margin:2rem 0;text-align:left}.step{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}.circle{width:34px;height:34px;border-radius:50%;background:#dee2e6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold}.circle.active{background:#ff4d8d}.circle.done{background:#10b981}.note{background:#fff0f5;border-left:5px solid #ff4d8d;padding:1rem;border-radius:8px;margin:1rem 0;text-align:left}</style></head><body><nav class="navbar"><a href="/" class="navbar-brand">👑 Beauty <span>Essentials</span></a><ul class="navbar-links"><li><a href="/">Home</a></li></ul></nav><div class="page-container" style="max-width:600px;margin-top:2.5rem;text-align:center"><div style="background:#fff;padding:2rem;border-radius:14px;box-shadow:0 4px 20px rgba(255,77,141,0.12)"><h2>📦 Track Your Order</h2><p style="color:#6c757d;margin:0.5rem 0 1.2rem">Enter your MoMo Transaction ID / Order Reference</p><form id="f" style="display:flex;gap:0.5rem;margin-bottom:1.2rem"><input id="ref" required placeholder="e.g. 2481029481" style="flex:1;padding:0.8rem;border:1.5px solid #f472b6;border-radius:8px"><button class="btn" style="width:auto;padding:0.8rem 1.2rem">Track</button></form><div id="res" style="display:none;text-align:left"><h3 id="st" style="color:#d62865"></h3><div class="note" id="note"></div><div id="details" style="background:#fff5f8;padding:1rem;border-radius:8px;font-size:0.92rem;line-height:1.6"></div><div class="timeline"><div class="step"><div class="circle done" id="s1">✓</div><div><strong>1. Order Received</strong></div></div><div class="step"><div class="circle" id="s2">2</div><div><strong>2. MoMo Verified / Packaging</strong></div></div><div class="step"><div class="circle" id="s3">3</div><div><strong>3. Out for Delivery</strong></div></div><div class="step"><div class="circle" id="s4">4</div><div><strong>4. Delivered</strong></div></div></div><a id="wa" target="_blank" class="btn" style="display:block;text-align:center;background:#25D366;margin-top:1rem;text-decoration:none">💬 WhatsApp Support</a></div></div></div><script>document.getElementById('f').onsubmit = async (e) => { e.preventDefault(); const r = document.getElementById('ref').value.trim(); const box = document.getElementById('res'); box.style.display = 'block'; document.getElementById('st').textContent = 'Searching...'; try { const res = await fetch('/api/orders/' + encodeURIComponent(r)); const data = await res.json(); if (!data.success) { document.getElementById('st').innerHTML = '<span style="color:red">❌ Order not found</span>'; document.getElementById('note').innerHTML = 'If you just paid by MoMo, WhatsApp us with your Transaction ID screenshot.'; document.getElementById('details').innerHTML = ''; document.getElementById('wa').href = 'https://wa.me/233548950991?text=' + encodeURIComponent('Hi, I paid and need help tracking. Tx ID: ' + r); return; } const o = data.order; document.getElementById('st').textContent = 'Status: ' + o.status; document.getElementById('note').innerHTML = '<strong>Latest update:</strong><br>' + (o.deliveryNote || 'Order received.'); document.getElementById('details').innerHTML = '<strong>Reference:</strong> ' + o.reference + '<br><strong>Customer:</strong> ' + o.customerName + '<br><strong>Phone:</strong> ' + o.phone + '<br><strong>Amount:</strong> GH₵' + Number(o.amount).toFixed(2) + '<br><strong>Address:</strong> ' + (o.address || 'N/A') + '<br><strong>Items:</strong> ' + o.items; ['s1','s2','s3','s4'].forEach(id => document.getElementById(id).className = 'circle'); document.getElementById('s1').className = 'circle done'; if (o.status === 'Awaiting MoMo Verification' || o.status === 'Packaging') document.getElementById('s2').className = 'circle active'; if (o.status === 'Out for Delivery') { document.getElementById('s2').className = 'circle done'; document.getElementById('s3').className = 'circle active'; } if (o.status === 'Delivered') { document.getElementById('s2').className = 'circle done'; document.getElementById('s3').className = 'circle done'; document.getElementById('s4').className = 'circle done'; } document.getElementById('wa').href = 'https://wa.me/233548950991?text=' + encodeURIComponent('Hi, checking my order: ' + o.reference); } catch (err) { document.getElementById('st').innerHTML = '<span style="color:red">❌ Connection error</span>'; } }; const q = new URLSearchParams(location.search).get('ref'); if (q) { document.getElementById('ref').value = q; document.getElementById('f').dispatchEvent(new Event('submit')); }</script></body></html>`);
});

app.listen(PORT, () => console.log('Beauty Essentials live on port ' + PORT));
module.exports = app;
