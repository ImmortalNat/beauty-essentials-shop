require('dotenv').config();
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
