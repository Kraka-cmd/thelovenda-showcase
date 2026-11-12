// Demo-webwinkel voor de showcase op thelovenda.store.
// Deze code bevat BEWUST zes fouten (D-01 t/m D-06). Ze horen bij het
// voorbeeld-acceptatietestrapport in /rapport/ en mogen hier niet worden hersteld.

const PRODUCTS = [
  { id: 'kaars', name: 'Geurkaars Vijg', price: 2500, desc: 'Sojawas, 40 branduren.' },
  { id: 'mok', name: 'Keramische Mok', price: 1250, desc: 'Handgedraaid, 300 ml.' },
  { id: 'zeep', name: 'Zeepblok Lavendel', price: 895, desc: 'Koudgeroerd, 120 gram.' },
  { id: 'plaid', name: 'Wollen Plaid', price: 3400, desc: 'Gerecyclede wol, 130 x 170 cm.' },
  { id: 'thee', name: 'Kruidenthee Mix', price: 1500, desc: 'Losse thee, 100 gram.' },
  { id: 'kaart', name: 'Wenskaarten Set', price: 1995, desc: 'Acht kaarten met envelop.' },
];
const SHIPPING = 495;
const FREE_SHIPPING_FROM = 5000;
const DISCOUNT_CODE = 'WELKOM10';

function createState() {
  return { cart: {}, factor: 1 };
}

// D-04: vergelijking is hoofdlettergevoelig.
function search(query) {
  const q = query.trim();
  return PRODUCTS.filter((p) => p.name.includes(q));
}

function addToCart(state, id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
}

// D-02: negatieve aantallen worden geaccepteerd.
function setQuantity(state, id, value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return;
  if (n === 0) delete state.cart[id];
  else state.cart[id] = n;
}

function removeFromCart(state, id) {
  delete state.cart[id];
}

// D-01: de korting wordt bij elke aanroep opnieuw toegepast.
function applyCode(state, code) {
  if (code.trim().toUpperCase() !== DISCOUNT_CODE) return false;
  state.factor *= 0.9;
  return true;
}

function itemCount(state) {
  return Object.values(state.cart).reduce((a, b) => a + b, 0);
}

function totals(state) {
  const subtotal = Object.entries(state.cart).reduce(
    (sum, [id, qty]) => sum + PRODUCTS.find((p) => p.id === id).price * qty,
    0
  );
  const afterDiscount = Math.round(subtotal * state.factor);
  const discount = subtotal - afterDiscount;
  // D-03: grenswaarde, moet >= zijn.
  const shipping =
    Object.keys(state.cart).length === 0 ? 0 : afterDiscount > FREE_SHIPPING_FROM ? 0 : SHIPPING;
  return { subtotal, discount, shipping, total: afterDiscount + shipping };
}

function euro(cents) {
  return (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
}

if (typeof module !== 'undefined') {
  module.exports = {
    PRODUCTS, createState, search, addToCart, setQuantity, removeFromCart,
    applyCode, itemCount, totals, euro,
  };
}

if (typeof document !== 'undefined') {
  const state = createState();
  const $ = (id) => document.getElementById(id);

  function renderProducts(list) {
    $('products').innerHTML = list.length
      ? list.map((p) => `
        <div class="card product">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div class="price">${euro(p.price)}</div>
          <button class="btn small" data-add="${p.id}">In winkelwagen</button>
        </div>`).join('')
      : '<p>Geen producten gevonden.</p>';
  }

  function renderBadge() {
    $('badge').textContent = itemCount(state);
  }

  function renderCart() {
    const ids = Object.keys(state.cart);
    $('cart').innerHTML = ids.length
      ? ids.map((id) => {
          const p = PRODUCTS.find((x) => x.id === id);
          return `
          <div class="cart-line">
            <span>${p.name}</span>
            <input type="number" aria-label="Aantal ${p.name}" value="${state.cart[id]}" data-qty="${id}">
            <button class="btn small secondary" data-remove="${id}">Verwijder</button>
          </div>`;
        }).join('')
      : '<p>Je winkelwagen is leeg.</p>';
    const t = totals(state);
    $('subtotal').textContent = euro(t.subtotal);
    $('discount').textContent = '- ' + euro(t.discount);
    $('shipping').textContent = euro(t.shipping);
    $('total').textContent = euro(t.total);
  }

  $('search').addEventListener('input', (e) => renderProducts(search(e.target.value)));

  $('products').addEventListener('click', (e) => {
    const id = e.target.dataset.add;
    if (!id) return;
    addToCart(state, id);
    renderCart();
    renderBadge();
  });

  $('cart').addEventListener('change', (e) => {
    const id = e.target.dataset.qty;
    if (!id) return;
    setQuantity(state, id, e.target.value);
    renderCart();
    renderBadge();
  });

  $('cart').addEventListener('click', (e) => {
    const id = e.target.dataset.remove;
    if (!id) return;
    removeFromCart(state, id);
    renderCart();
    // D-05: de teller in de kop wordt hier niet bijgewerkt.
  });

  $('code-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = applyCode(state, $('code').value);
    $('code-msg').textContent = ok ? 'Kortingscode toegepast: 10% korting.' : 'Deze kortingscode is niet geldig.';
    $('code-msg').className = 'msg ' + (ok ? 'pass' : 'fail');
    renderCart();
  });

  // D-06: er wordt niet gecontroleerd of de winkelwagen leeg is.
  $('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    $('order-msg').textContent =
      'Bedankt voor je bestelling van ' + euro(totals(state).total) +
      '. (Demo: er is niets besteld en er zijn geen gegevens verstuurd.)';
    $('order-msg').className = 'msg pass';
  });

  renderProducts(PRODUCTS);
  renderCart();
  renderBadge();
}
