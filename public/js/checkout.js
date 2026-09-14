const cart = JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]');
if (!cart.length) window.location.href = '/cart';
const tot = cart.reduce((s, i) => s + (i.price * i.qty), 0);

document.getElementById('orderSummary').innerHTML = `
  <h3>Order Summary</h3>
  ${cart.map(i => `<div class="summary-row"><span>${i.name} x${i.qty}</span><span>GH₵${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
  <div class="summary-row total"><span>Total</span><span>GH₵${tot.toFixed(2)}</span></div>
`;

// Dynamically load live MoMo settings from Admin
async function loadCheckoutSettings() {
  try {
    const timestamp = Date.now();
    const res = await fetch('/api/settings?t=' + timestamp);
    const settings = await res.json();

    const momo1 = document.getElementById('momoDisplay1');
    const momo2 = document.getElementById('momoDisplay2');
    const momoName = document.getElementById('momoNameDisplay');

    if (momo1) momo1.textContent = settings.supportPhone1 || '0548950991';

    if (momo2) {
      if (settings.supportPhone2 && settings.supportPhone2.trim().length > 3) {
        momo2.textContent = settings.supportPhone2.trim();
        momo2.style.display = 'block';
      } else {
        momo2.style.display = 'none';
      }
    }

    if (momoName) {
      momoName.textContent = settings.momoName || 'Beauty Essentials';
    }
  } catch (err) {
    console.error('Failed to load checkout settings:', err);
  }
}

document.getElementById('checkoutForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('payBtn');
  const txId = document.getElementById('momoTxId').value.trim();
  if (!txId) return alert('Please enter your MoMo Transaction ID');

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
        address: document.getElementById('address').value.trim(),
        transactionId: txId,
        amount: tot,
        itemsSummary: cart.map(i => `${i.name} (x${i.qty})`).join(', '),
        cartItems: cart
      })
    });
    const d = await res.json();
    if (d.success) {
      localStorage.removeItem('shopwave_beauty_cart');
      window.location.href = '/success?reference=' + encodeURIComponent(d.reference);
    } else {
      alert(d.message || 'Submission failed');
      btn.disabled = false;
      btn.textContent = 'Submit MoMo Order ✓';
    }
  } catch (err) {
    alert('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Submit MoMo Order ✓';
  }
};

document.addEventListener('DOMContentLoaded', loadCheckoutSettings);
