let products = [];
let settings = {};

function getCart() { return JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('shopwave_beauty_cart', JSON.stringify(c)); updateB(); }
function updateB() { const el = document.getElementById('cartCount'); if(el) el.textContent = getCart().reduce((s,i)=>s+i.qty,0); }
function toast(m) { const t=document.getElementById('toast'); if(!t)return; t.textContent=m; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }

function render(l) {
  const g = document.getElementById('productsGrid'); if(!g)return;
  if (!l || !l.length) {
    g.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:2rem; color:#6c757d;">No products in this category.</p>';
    return;
  }
  g.innerHTML = l.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <span class="product-category">${p.category || 'Beauty'}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || ''}</p>
        <div class="product-price">GH₵${Number(p.price).toFixed(2)}</div>
        <button class="btn" onclick="add(${p.id})">Add to Cart 🛒</button>
      </div>
    </div>
  `).join('');
}

function add(id) {
  const p = products.find(x => x.id === id); if(!p)return;
  const c = getCart(); const ex = c.find(x => x.id === id);
  if(ex) ex.qty += 1; else c.push({...p, qty: 1});
  saveCart(c); toast('Added ' + p.name + ' to cart!');
}

function filterCat(c, b) {
  document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
  if (b) b.classList.add('active');
  render(c === 'all' ? products : products.filter(p => p.category === c));
}

async function load() {
  try {
    // Add timestamp cache-buster so browser always fetches fresh data
    const timestamp = Date.now();
    const [prodRes, setRes] = await Promise.all([
      fetch('/api/products?t=' + timestamp),
      fetch('/api/settings?t=' + timestamp)
    ]);

    products = await prodRes.json();
    settings = await setRes.json();

    // 1. Update Top Announcement Bar
    const annEl = document.getElementById('announcementBar');
    if (annEl && settings.announcement) annEl.textContent = settings.announcement;

    // 2. Update Navbar Store Name & Tagline
    if (settings.storeName) {
      document.querySelectorAll('.navbar-brand').forEach(el => {
        el.innerHTML = `👑 ${settings.storeName} <span>${settings.tagline || ''}</span>`;
      });
      const fb = document.getElementById('footerBrand');
      if (fb) fb.textContent = settings.storeName;
    }

    // 3. Update Hero Title & Subtitle
    const hTitle = document.getElementById('heroTitle');
    if (hTitle && settings.heroTitle) hTitle.textContent = settings.heroTitle;
    
    const hSub = document.getElementById('heroSubtitle');
    if (hSub && settings.heroSubtitle) hSub.textContent = settings.heroSubtitle;

    // 4. Update Contact Numbers & WhatsApp
    const wa = settings.whatsappNumber || '233548950991';
    const p1 = settings.supportPhone1 || '0548950991';
    const p2 = settings.supportPhone2 || '0249356589';

    const contactContainer = document.getElementById('contactNumbers');
    if (contactContainer) {
      const waClean = wa.replace(/[^0-9]/g, '');
      const p1Clean = p1.replace(/[^0-9]/g, '');
      const p2Clean = p2.replace(/[^0-9]/g, '');

      contactContainer.innerHTML = `
        <a href="https://wa.me/${waClean}" target="_blank" class="contact-btn">💬 WhatsApp +${waClean}</a>
        ${p2 ? `<a href="https://wa.me/233${p2Clean.replace(/^0/,'')}" target="_blank" class="contact-btn">💬 WhatsApp ${p2}</a>` : ''}
      `;
    }

    render(products);
    updateB();
  } catch (err) {
    console.error('Error loading store data:', err);
  }
}

document.addEventListener('DOMContentLoaded', load);
