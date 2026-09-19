const cart = JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]');
if (!cart.length) window.location.href = '/cart';

const cartSubtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
let deliveryFee = 0;
let grandTotal = cartSubtotal;
let deliveryLocations = [];

function renderSummary() {
  document.getElementById('orderSummary').innerHTML = `
    <h3>Order Summary</h3>
    ${cart.map(i => `<div class="summary-row"><span>${i.name} x${i.qty}</span><span>GH₵${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
    <div style="border-top: 1px solid var(--gray-200); margin-top: 1rem; padding-top: 1rem;">
      <div class="summary-row" style="color:var(--gray-600); font-size:0.9rem;"><span>Subtotal:</span><span>GH₵${cartSubtotal.toFixed(2)}</span></div>
      <div class="summary-row" style="color:var(--primary); font-size:0.9rem; font-weight:bold;"><span>Delivery Fee:</span><span>GH₵${deliveryFee.toFixed(2)}</span></div>
      <div class="summary-row total"><span>Total to Pay:</span><span>GH₵${grandTotal.toFixed(2)}</span></div>
    </div>
  `;
}

function populateRegions() {
  const regionSelect = document.getElementById('regionSelect');
  if (!regionSelect || !deliveryLocations.length) return;
  const regions = [...new Set(deliveryLocations.map(l => l.region || 'Greater Accra'))];
  regionSelect.innerHTML = `<option value="">-- Choose Ghana Region --</option>` + regions.map(r => `<option value="${r}">${r} Region</option>`).join('');
}

async function loadCheckoutSettings() {
  try {
    const [setRes, delRes] = await Promise.all([
      fetch('/api/settings?t=' + Date.now()),
      fetch('/api/delivery?t=' + Date.now())
    ]);
    const s = await setRes.json();
    deliveryLocations = await delRes.json();

    document.getElementById('momoDisplay1').textContent = s.supportPhone1 || '0548950991';
    if (s.supportPhone2) {
      document.getElementById('momoDisplay2').textContent = s.supportPhone2;
      document.getElementById('momoDisplay2').style.display = 'block';
    }
    document.getElementById('momoNameDisplay').textContent = s.momoName || 'Beauty Essentials';

    const locSelect = document.getElementById('townSelect');
    if (deliveryLocations.length === 0) {
      locSelect.innerHTML = `<option value="Free Delivery">Free Delivery Available (GH₵0.00)</option>`;
    } else {
      populateRegions();
    }
    renderSummary();
  } catch (err) { console.error(err); }
}

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'regionSelect') {
    const selectedRegion = e.target.value;
    const townSelect = document.getElementById('townSelect');
    if (!selectedRegion) {
      townSelect.innerHTML = `<option value="">-- Select Region First --</option>`;
      townSelect.disabled = true;
      deliveryFee = 0;
    } else {
      const towns = deliveryLocations.filter(l => (l.region || 'Greater Accra') === selectedRegion);
      townSelect.innerHTML = `<option value="">-- Choose Town / Area --</option>` +
        towns.map(t => `<option value="${t.id}">${t.town} (+ GH₵${Number(t.fee).toFixed(2)})</option>`).join('');
      townSelect.disabled = false;
      deliveryFee = 0;
    }
    grandTotal = cartSubtotal + deliveryFee;
    renderSummary();
  }

  if (e.target && e.target.id === 'townSelect') {
    const selectedId = Number(e.target.value);
    const selectedTown = deliveryLocations.find(l => l.id === selectedId);
    deliveryFee = selectedTown ? Number(selectedTown.fee) : 0;
    grandTotal = cartSubtotal + deliveryFee;
    renderSummary();
  }
});

document.getElementById('checkoutForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('payBtn');
  const txId = document.getElementById('momoTxId').value.trim();
  if (!txId) return alert('Enter your MoMo Transaction ID');

  const reg = document.getElementById('regionSelect')?.value || '';
  const townId = Number(document.getElementById('townSelect')?.value || 0);
  const townObj = deliveryLocations.find(l => l.id === townId);
  const street = document.getElementById('address')?.value.trim() || '';
  const townName = townObj ? townObj.town : 'General Area';
  const fullAddress = `${street}, ${townName}, ${reg} Region`;

  let itemsList = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
  if (deliveryFee > 0) itemsList += ` | Delivery Fee: GH₵${deliveryFee.toFixed(2)}`;

  btn.disabled = true;
  btn.textContent = 'Submitting order...';

  try {
    const res = await fetch('/api/payment/direct-momo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: fullAddress,
        transactionId: txId,
        amount: grandTotal,
        itemsSummary: itemsList,
        cartItems: cart
      })
    });
    const d = await res.json();
    if (d.success) {
      localStorage.removeItem('shopwave_beauty_cart');
      window.location.href = '/success?reference=' + encodeURIComponent(d.reference);
    } else {
      alert(d.message || 'Submission failed');
      btn.disabled = false; btn.textContent = 'Submit MoMo Order ✓';
    }
  } catch (err) {
    alert('Network error. Try again.');
    btn.disabled = false; btn.textContent = 'Submit MoMo Order ✓';
  }
};

document.addEventListener('DOMContentLoaded', loadCheckoutSettings);
