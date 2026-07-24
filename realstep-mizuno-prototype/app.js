const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

const EMAILJS_CONFIG = {
  serviceId: 'service_8o99xft',
  templateId: 'template_as1l96o',
  publicKey: 'y0YUw9SkckUUTgg1q',
  realStepEmail: 'martin@marquevich.com',
};

emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });

const dama = [
  { size: '36', quantity: 2 }, { size: '37', quantity: 2 }, { size: '38', quantity: 2 },
  { size: '39', quantity: 2 }, { size: '39.5', quantity: 2 }, { size: '40', quantity: 2 },
];
const hombreStandard = [
  { size: '41', quantity: 1 }, { size: '41.5', quantity: 1 }, { size: '42', quantity: 2 },
  { size: '43', quantity: 2 }, { size: '43.5', quantity: 2 }, { size: '44', quantity: 2 }, { size: '45', quantity: 2 },
];
const hombreExtended = [
  { size: '39.5', quantity: 1 }, { size: '40', quantity: 1 }, { size: '41', quantity: 1 },
  { size: '41.5', quantity: 1 }, { size: '42', quantity: 1 }, { size: '43', quantity: 2 },
  { size: '43.5', quantity: 2 }, { size: '44', quantity: 1 }, { size: '45', quantity: 1 }, { size: '46', quantity: 1 },
];

const products = [
  { id:'enforce-060', page:2, name:'Wave Enforce Tour 2 CC', code:'61GC2504-060', color:'White / Baritone Blue / Fiery Coral 2', price:162104.68, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreStandard}] },
  { id:'enforce-005', page:3, name:'Wave Enforce Tour 2 CC', code:'61GC2504-005', color:'Odyssey Gray / White / Baritone Blue', price:162104.68, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreExtended}] },
  { id:'exceed-005', page:4, name:'Wave Exceed Court CC', code:'61GC2520-005', color:'Odyssey Gray / White / Blue Granite', price:115788.89, curves:[{id:'hombre',label:'Hombre',composition:hombreExtended}] },
  { id:'break-060', page:5, name:'Break Shot 5 CC', code:'61GC2525-060', color:'White / Calypso Coral / Citrus', price:69473.11, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreStandard}] },
  { id:'break-005', page:6, name:'Break Shot 5 CC', code:'61GC2525-005', color:'Odyssey Gray / White / Blue Granite', price:69473.11, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreStandard}] },
];

let cart = JSON.parse(localStorage.getItem('realstep-cart') || '[]');
const qtyByProduct = Object.fromEntries(products.map(p => [p.id, 1]));

function curvePrice(product) { return product.price * 12; }
function compositionText(curve) { return curve.composition.map(x => `${x.size} (${x.quantity})`).join(' · '); }

function renderProducts() {
  document.getElementById('product-list').innerHTML = products.map((product, index) => {
    const selected = product.curves[0].id;
    return `
      <article class="product-shell" id="${product.id}">
        <div class="catalog-page"><img src="assets/pages/page-${product.page}.png" alt="Ficha ${product.name}, ${product.color}" loading="lazy"></div>
        <div class="order-panel">
          <p class="eyebrow">Producto ${String(index + 1).padStart(2,'0')} / 05</p>
          <h2>${product.name}</h2>
          <p class="product-code">${product.code} · ${product.color}</p>
          <div class="price-grid">
            <div class="price-card"><span>Precio por par</span><strong>${ARS.format(product.price)}</strong></div>
            <div class="price-card"><span>Precio por curva</span><strong>${ARS.format(curvePrice(product))}</strong></div>
          </div>
          <span class="field-label">Curva disponible</span>
          <div class="curve-options">
            ${product.curves.map((curve, i) => `
              <label class="curve-option">
                <span><input type="radio" name="curve-${product.id}" value="${curve.id}" ${i===0?'checked':''}> <strong>${curve.label}</strong></span>
                <small>12 pares</small>
              </label>`).join('')}
          </div>
          <div class="composition" id="composition-${product.id}">${compositionText(product.curves[0])}</div>
          <span class="field-label">Cantidad de curvas</span>
          <div class="quantity-row">
            <button class="qty-button" data-qty="minus" data-product="${product.id}" aria-label="Restar">−</button>
            <div class="qty-value" id="qty-${product.id}">1</div>
            <button class="qty-button" data-qty="plus" data-product="${product.id}" aria-label="Sumar">+</button>
          </div>
          <button class="primary-button" data-add="${product.id}">Agregar al pedido</button>
        </div>
      </article>`;
  }).join('');

  products.forEach(product => {
    document.querySelectorAll(`input[name="curve-${product.id}"]`).forEach(input => {
      input.addEventListener('change', () => {
        const curve = product.curves.find(c => c.id === input.value);
        document.getElementById(`composition-${product.id}`).textContent = compositionText(curve);
      });
    });
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const selectedCurveId = document.querySelector(`input[name="curve-${product.id}"]:checked`).value;
  const curve = product.curves.find(c => c.id === selectedCurveId);
  const quantity = qtyByProduct[productId];
  const key = `${productId}-${selectedCurveId}`;
  const existing = cart.find(item => item.key === key);
  if (existing) existing.quantity += quantity;
  else cart.push({ key, productId, curveId:selectedCurveId, quantity });
  saveCart();
  showToast(`${product.name} · Curva ${curve.label} agregada`);
}

function saveCart() {
  localStorage.setItem('realstep-cart', JSON.stringify(cart));
  renderCart();
}

function getTotals() {
  return cart.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    acc.curves += item.quantity;
    acc.pairs += item.quantity * 12;
    acc.total += item.quantity * curvePrice(product);
    return acc;
  }, { curves:0, pairs:0, total:0 });
}

function renderCart() {
  const list = document.getElementById('cart-items');
  if (!cart.length) list.innerHTML = '<div class="empty-cart"><strong>Tu pedido está vacío.</strong><p>Agregá al menos una curva para continuar.</p></div>';
  else list.innerHTML = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    const curve = product.curves.find(c => c.id === item.curveId);
    return `<article class="cart-item">
      <div class="cart-item-head"><div><h3>${product.name}</h3><p>${product.code} · Curva ${curve.label}</p></div><button class="remove-item" data-remove="${item.key}">Eliminar</button></div>
      <p>${item.quantity} curva${item.quantity>1?'s':''} · ${item.quantity*12} pares</p>
      <strong>${ARS.format(item.quantity * curvePrice(product))}</strong>
    </article>`;
  }).join('');
  const totals = getTotals();
  document.getElementById('cart-count').textContent = totals.curves;
  document.getElementById('summary-curves').textContent = totals.curves;
  document.getElementById('summary-pairs').textContent = totals.pairs;
  document.getElementById('summary-total').textContent = ARS.format(totals.total);
}

function openCart() { document.getElementById('cart-drawer').classList.add('open'); document.getElementById('cart-drawer').setAttribute('aria-hidden','false'); }
function closeCart() { document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('cart-drawer').setAttribute('aria-hidden','true'); }
function openCheckout() {
  if (!cart.length) return showToast('Agregá al menos una curva al pedido.');
  closeCart();
  const totals = getTotals();
  document.getElementById('checkout-preview').innerHTML = `<strong>${totals.curves} curvas · ${totals.pairs} pares</strong><br>Total estimado: ${ARS.format(totals.total)}`;
  document.getElementById('checkout-modal').classList.add('open');
  document.getElementById('checkout-modal').setAttribute('aria-hidden','false');
}
function closeCheckout() { document.getElementById('checkout-modal').classList.remove('open'); document.getElementById('checkout-modal').setAttribute('aria-hidden','true'); }
function showToast(message) { const toast=document.getElementById('toast'); toast.textContent=message; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2200); }

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildProductRows() {
  return cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    const curve = product.curves.find(c => c.id === item.curveId);
    return `
      <tr>
        <td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;vertical-align:top;">
          <strong style="color:#0c2045;">${escapeHtml(product.name)}</strong><br>
          <span style="font-size:12px;color:#64748b;">${escapeHtml(product.code)} · ${escapeHtml(product.color)}</span><br>
          <span style="font-size:13px;color:#334155;">Curva ${escapeHtml(curve.label)} · ${escapeHtml(compositionText(curve))}</span>
        </td>
        <td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;text-align:center;vertical-align:top;">${item.quantity}</td>
        <td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;text-align:center;vertical-align:top;">${item.quantity * 12}</td>
        <td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;text-align:right;vertical-align:top;font-weight:700;white-space:nowrap;">${ARS.format(item.quantity * curvePrice(product))}</td>
      </tr>`;
  }).join('');
}

function buildEmailHtml(form, recipient) {
  const totals = getTotals();
  const customerName = escapeHtml(form.get('name'));
  const customerEmail = escapeHtml(form.get('email'));
  const isOwner = recipient === 'owner';
  const title = isOwner ? 'Nuevo pedido recibido' : '¡Recibimos tu pedido!';
  const intro = isOwner
    ? 'Se registró un nuevo pedido desde el catálogo Mizuno Pádel 2026.'
    : `Hola ${customerName}, recibimos correctamente tu pedido. Un asesor de Real Step se comunicará con vos para coordinar la operación.`;

  const customerBlock = isOwner ? `
    <div style="margin:24px 0;padding:18px;background:#f3f6fa;border-radius:10px;">
      <h2 style="margin:0 0 12px;color:#0c2045;font-size:18px;">Datos del cliente</h2>
      <p style="margin:5px 0;"><strong>Nombre:</strong> ${customerName}</p>
      <p style="margin:5px 0;"><strong>Comercio:</strong> ${escapeHtml(form.get('company'))}</p>
      <p style="margin:5px 0;"><strong>Teléfono:</strong> ${escapeHtml(form.get('phone'))}</p>
      <p style="margin:5px 0;"><strong>Correo:</strong> ${customerEmail}</p>
      <p style="margin:5px 0;"><strong>Ubicación:</strong> ${escapeHtml(form.get('city'))}, ${escapeHtml(form.get('province'))}</p>
      <p style="margin:5px 0;"><strong>Dirección:</strong> ${escapeHtml(form.get('address') || '-')}</p>
    </div>` : '';

  return `<!doctype html>
  <html lang="es"><body style="margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#17233a;">
    <div style="max-width:760px;margin:0 auto;padding:24px 12px;">
      <div style="background:#0c2045;padding:22px 26px;border-radius:14px 14px 0 0;">
        <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:1px;">REAL STEP</div>
        <div style="color:#dbe5f4;font-size:12px;margin-top:4px;letter-spacing:1.5px;">CATÁLOGO MAYORISTA</div>
      </div>
      <div style="background:#fff;padding:28px 26px;border-radius:0 0 14px 14px;box-shadow:0 8px 28px rgba(12,32,69,.08);">
        <div style="width:56px;height:4px;background:#ef2424;margin-bottom:20px;"></div>
        <h1 style="margin:0;color:#0c2045;font-size:28px;">${title}</h1>
        <p style="font-size:15px;line-height:1.6;color:#475569;">${intro}</p>
        ${customerBlock}
        <h2 style="margin:26px 0 10px;color:#0c2045;font-size:18px;">Detalle del pedido</h2>
        <div style="overflow-x:auto;">
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead><tr style="background:#0c2045;color:#fff;">
              <th style="padding:12px;text-align:left;">Producto</th>
              <th style="padding:12px;text-align:center;">Curvas</th>
              <th style="padding:12px;text-align:center;">Pares</th>
              <th style="padding:12px;text-align:right;">Subtotal</th>
            </tr></thead>
            <tbody>${buildProductRows()}</tbody>
          </table>
        </div>
        <div style="margin:22px 0 0 auto;max-width:330px;background:#f3f6fa;padding:18px;border-radius:10px;">
          <p style="margin:5px 0;display:flex;justify-content:space-between;"><span>Total de curvas</span><strong>${totals.curves}</strong></p>
          <p style="margin:5px 0;display:flex;justify-content:space-between;"><span>Total de pares</span><strong>${totals.pairs}</strong></p>
          <p style="margin:14px 0 0;padding-top:14px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;font-size:18px;color:#0c2045;"><span>Total estimado</span><strong>${ARS.format(totals.total)}</strong></p>
        </div>
        <div style="margin-top:22px;padding:16px;border-left:4px solid #ef2424;background:#fff7f7;">
          <strong>Observaciones</strong><br>
          <span style="color:#475569;line-height:1.5;">${escapeHtml(form.get('notes') || 'Sin observaciones.')}</span>
        </div>
      </div>
    </div>
  </body></html>`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendOrderEmails(form) {
  const customerEmail = String(form.get('email')).trim();
  const company = String(form.get('company')).trim();
  const customerName = String(form.get('name')).trim();

  await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
    to_email: EMAILJS_CONFIG.realStepEmail,
    reply_to: customerEmail,
    subject: `Nuevo pedido Real Step - ${company}`,
    email_html: buildEmailHtml(form, 'owner'),
    customer_name: customerName,
  });

  // EmailJS limita el envío a una solicitud por segundo.
  await delay(1150);

  await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
    to_email: customerEmail,
    reply_to: EMAILJS_CONFIG.realStepEmail,
    subject: 'Recibimos tu pedido - Real Step',
    email_html: buildEmailHtml(form, 'customer'),
    customer_name: customerName,
  });
}

document.addEventListener('click', event => {
  const qty = event.target.closest('[data-qty]');
  if (qty) {
    const id = qty.dataset.product;
    qtyByProduct[id] = Math.max(1, qtyByProduct[id] + (qty.dataset.qty === 'plus' ? 1 : -1));
    document.getElementById(`qty-${id}`).textContent = qtyByProduct[id];
  }
  const add = event.target.closest('[data-add]'); if (add) addToCart(add.dataset.add);
  const remove = event.target.closest('[data-remove]'); if (remove) { cart = cart.filter(i => i.key !== remove.dataset.remove); saveCart(); }
  if (event.target.closest('[data-close-cart]')) closeCart();
  if (event.target.closest('[data-close-checkout]')) closeCheckout();
});

document.getElementById('open-cart').addEventListener('click', openCart);
document.getElementById('go-products').addEventListener('click', () => document.getElementById('productos').scrollIntoView());
document.getElementById('checkout-button').addEventListener('click', openCheckout);
document.getElementById('checkout-form').addEventListener('submit', async event => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const submitButton = formElement.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;

  submitButton.disabled = true;
  submitButton.textContent = 'Enviando pedido...';

  try {
    const form = new FormData(formElement);
    await sendOrderEmails(form);
    cart = [];
    saveCart();
    formElement.reset();
    closeCheckout();
    showToast('Pedido enviado correctamente. Revisá tu correo.');
  } catch (error) {
    console.error('No se pudo enviar el pedido:', error);
    showToast('No pudimos enviar el pedido. Intentá nuevamente.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

renderProducts();
renderCart();
