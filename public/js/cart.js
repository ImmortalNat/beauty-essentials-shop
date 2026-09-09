function getCart() { return JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]'); }
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
  items.innerHTML = c.map(i => `
    <div style="display:flex; gap:1rem; background:#fff; padding:1rem; margin-bottom:1rem; border-radius:8px; align-items:center;">
      <img src="${i.image}" style="width:70px; height:70px; object-fit:cover; border-radius:6px;">
      <div style="flex:1;">
        <h4>${i.name}</h4>
        <strong style="color:var(--primary-dark);">GH₵${Number(i.price).toFixed(2)}</strong>
      </div>
      <div>
        <button style="padding:2px 8px;" onclick="updateQty(${i.id}, -1)">-</button>
        <span style="margin:0 8px; font-weight:bold;">${i.qty}</span>
        <button style="padding:2px 8px;" onclick="updateQty(${i.id}, 1)">+</button>
      </div>
    </div>
  `).join('');
  sum.innerHTML = `
    <h3>Order Total</h3>
    <div class="summary-row total"><span>Total</span><span>GH₵${tot.toFixed(2)}</span></div>
    <a href="/checkout" class="btn" style="display:block; text-align:center; margin-top:1rem;">Proceed to Checkout →</a>
  `;
}
render();
