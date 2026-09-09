const cart = JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]');
if(!cart.length) window.location.href = '/';
const tot = cart.reduce((s,i)=>s+(i.price*i.qty), 0);
document.getElementById('orderSummary').innerHTML = '<h3>Selected Essentials</h3>' + cart.map(i => '<div class="summary-row"><span>' + i.name + ' x' + i.qty + '</span><span>GH₵' + (i.price * i.qty).toFixed(2) + '</span></div>').join('') + '<div class="summary-row total"><span>Total</span><span>GH₵' + tot.toFixed(2) + '</span></div>';

let payMethod = 'online';
window.setPayment = function(m) {
  payMethod = m;
  document.getElementById('btnOnline').className = 'pay-tab ' + (m==='online'?'active':'');
  document.getElementById('btnDirect').className = 'pay-tab ' + (m==='direct'?'active':'');
  document.getElementById('directBox').style.display = m==='direct'?'block':'none';
  document.getElementById('payBtn').textContent = m==='online'?'Pay with Paystack 💳':'Submit Direct MoMo Order ✓';
};

document.getElementById('checkoutForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('payBtn'); btn.disabled = true;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const itemsList = cart.map(i => i.name + ' (x' + i.qty + ')').join(', ');

  if (payMethod === 'online') {
    btn.textContent = 'Connecting to Paystack...';
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount: tot, metadata: { customerName: name, phone, address, itemsSummary: itemsList, cartItems: cart } })
      });
      const d = await res.json();
      if (d.status && d.data.authorization_url) window.location.href = d.data.authorization_url;
      else { alert('Payment failed'); btn.disabled = false; }
    } catch(err) { alert('Network error'); btn.disabled = false; }
  } else {
    const txId = document.getElementById('momoTxId').value.trim();
    if (!txId) return alert('Enter MoMo Transaction ID');
    btn.textContent = 'Submitting order...';
    try {
      const res = await fetch('/api/payment/direct-momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address, transactionId: txId, amount: tot, itemsSummary: itemsList })
      });
      const d = await res.json();
      if (d.success) window.location.href = '/success?reference=' + encodeURIComponent(txId);
      else { alert('Submission failed'); btn.disabled = false; }
    } catch(err) { alert('Error submitting'); btn.disabled = false; }
  }
};
