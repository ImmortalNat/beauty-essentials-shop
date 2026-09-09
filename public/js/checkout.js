const cart = JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]');
if (!cart.length) window.location.href = '/cart';
const tot = cart.reduce((s, i) => s + (i.price * i.qty), 0);

document.getElementById('orderSummary').innerHTML = `
  <h3>Order Summary</h3>
  ${cart.map(i => `<div class="summary-row"><span>${i.name} x${i.qty}</span><span>GH₵${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
  <div class="summary-row total"><span>Total</span><span>GH₵${tot.toFixed(2)}</span></div>
`;

document.getElementById('checkoutForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('payBtn');
  const txId = document.getElementById('momoTxId').value.trim();
  if (!txId) return alert('Enter your MoMo Transaction ID');

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
    alert('Network error. Try again.');
    btn.disabled = false;
    btn.textContent = 'Submit MoMo Order ✓';
  }
};
