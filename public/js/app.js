let products = [];
function getCart() { return JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('shopwave_beauty_cart', JSON.stringify(c)); updateB(); }
function updateB() { const el = document.getElementById('cartCount'); if(el) el.textContent = getCart().reduce((s,i)=>s+i.qty,0); }
function toast(m) { const t=document.getElementById('toast'); if(!t)return; t.textContent=m; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }

function render(l) {
  const g = document.getElementById('productsGrid'); if(!g)return;
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
  b.classList.add('active');
  render(c === 'all' ? products : products.filter(p => p.category === c));
}

async function load() {
  products = await (await fetch('/api/products')).json();
  render(products);
  updateB();
}

document.addEventListener('DOMContentLoaded', load);
