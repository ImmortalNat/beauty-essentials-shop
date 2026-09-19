// Complete 16-Region Ghana Delivery Database for Beauty Essentials
const DEFAULT_GHANA_DELIVERY = [
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

const cart = JSON.parse(localStorage.getItem('shopwave_beauty_cart') || '[]');
if (!cart.length) window.location.href = '/cart';

const cartSubtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
let deliveryFee = 0;
let grandTotal = cartSubtotal;
let deliveryLocations = DEFAULT_GHANA_DELIVERY;

function renderSummary() {
  document.getElementById('orderSummary').innerHTML = `
    <h3>Order Summary</h3>
    ${cart.map(i => `<div class="summary-row"><span>${i.name} x${i.qty}</span><span>GH₵${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
    <div style="border-top: 1px solid var(--gray-200); margin-top: 1rem; padding-top: 1rem;">
      <div class="summary-row" style="color:var(--gray-600); font-size:0.9rem;"><span>Subtotal:</span><span>GH₵${cartSubtotal.toFixed(2)}</span></div>
      <div class="summary-row" style="color:var(--primary-dark); font-size:0.9rem; font-weight:bold;"><span>Delivery Fee:</span><span>GH₵${deliveryFee.toFixed(2)}</span></div>
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
    
    if (delRes.ok) {
      const fetchedLocations = await delRes.json();
      if (Array.isArray(fetchedLocations) && fetchedLocations.length > 0) {
        deliveryLocations = fetchedLocations;
      }
    }

    const m1 = document.getElementById('momoDisplay1');
    const m2 = document.getElementById('momoDisplay2');
    const nameEl = document.getElementById('momoNameDisplay');

    if (m1) m1.textContent = s.supportPhone1 || '0548950991';
    if (m2) {
      if (s.supportPhone2 && s.supportPhone2.trim().length > 3) {
        m2.textContent = s.supportPhone2.trim();
        m2.style.display = 'block';
      } else {
        m2.style.display = 'none';
      }
    }
    if (nameEl) nameEl.textContent = s.momoName || 'Mary Appiah / Beauty Essentials';

    populateRegions();
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
