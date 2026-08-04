import { ARS, PAIRS_PER_CURVE, STORAGE_KEY, compositionText, curvePrice, findCurve, findProduct, products } from './data.js';
import { sendOrderEmails } from './email.js';

const $ = selector => document.querySelector(selector);
const elements = {
  productList: $('#product-list'), cart: $('#cart-drawer'), cartPanel: $('.drawer-panel'), cartItems: $('#cart-items'), cartCount: $('#cart-count'),
  modal: $('#checkout-modal'), modalCard: $('.modal-card'), form: $('#checkout-form'), success: $('#success-panel'), status: $('#submit-status'), toast: $('#toast'),
  openCart: $('#open-cart'), clearCart: $('#clear-cart'), checkout: $('#checkout-button'), preview: $('#checkout-preview'),
};
let cart = [];
let activeDialog = null;
let returnFocus = null;
let toastTimer;
let isSubmitting = false;
const qtyByProduct = Object.fromEntries(products.map(product => [product.id, 1]));

function sanitizeCart(value) {
  if (!Array.isArray(value)) return [];
  const merged = new Map();
  value.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const product = findProduct(String(item.productId ?? ''));
    const curve = findCurve(product, String(item.curveId ?? ''));
    const quantity = Math.trunc(Number(item.quantity));
    if (!product || !curve || !Number.isFinite(quantity) || quantity < 1) return;
    const key = `${product.id}-${curve.id}`;
    const existing = merged.get(key);
    merged.set(key, { key, productId:product.id, curveId:curve.id, quantity:(existing?.quantity || 0) + quantity });
  });
  return [...merged.values()];
}

function loadCart() {
  let parsed; let invalidJson = false;
  try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { parsed = []; invalidJson = true; }
  const clean = sanitizeCart(parsed);
  try { if (invalidJson || JSON.stringify(clean) !== JSON.stringify(parsed)) localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch { /* La app sigue operativa si el almacenamiento está bloqueado. */ }
  return clean;
}

function persistCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { showToast('No se pudo guardar el pedido en este navegador.'); }
  renderCart();
}

function getTotals() {
  return cart.reduce((totals, item) => {
    const product = findProduct(item.productId);
    if (!product) return totals;
    totals.curves += item.quantity;
    totals.pairs += item.quantity * PAIRS_PER_CURVE;
    totals.total += item.quantity * curvePrice(product);
    return totals;
  }, { curves:0, pairs:0, total:0 });
}

function renderProducts() {
  if (!elements.productList) return;
  elements.productList.innerHTML = products.map((product,index) => `<article class="product-shell" id="${product.id}"><div class="catalog-page"><img src="assets/pages/page-${product.page}.png" alt="Ficha ${product.name}, ${product.color}" loading="lazy"></div><div class="order-panel"><p class="eyebrow">Producto ${String(index+1).padStart(2,'0')} / ${String(products.length).padStart(2,'0')}</p><h2>${product.name}</h2><p class="product-code"><strong>${product.code}</strong><span>${product.color}</span></p><div class="price-grid"><div class="price-card"><span>Precio por par</span><strong>${ARS.format(product.price)}</strong></div><div class="price-card featured"><span>Precio por curva</span><strong>${ARS.format(curvePrice(product))}</strong><small>12 pares</small></div></div><fieldset class="curve-fieldset"><legend class="field-label">Curva disponible</legend><div class="curve-options">${product.curves.map((curve,i)=>`<label class="curve-option"><span><input type="radio" name="curve-${product.id}" value="${curve.id}" ${i===0?'checked':''}> <strong>${curve.label}</strong></span><small>12 pares</small></label>`).join('')}</div></fieldset><div class="composition" id="composition-${product.id}"><strong>Composición:</strong> ${compositionText(product.curves[0])}</div><span class="field-label">Cantidad de curvas</span><div class="quantity-row"><button class="qty-button" type="button" data-qty="minus" data-product="${product.id}" aria-label="Restar una curva">−</button><output class="qty-value" id="qty-${product.id}">1</output><button class="qty-button" type="button" data-qty="plus" data-product="${product.id}" aria-label="Sumar una curva">+</button></div><button class="primary-button" type="button" data-add="${product.id}">Agregar al pedido</button></div></article>`).join('');
}

function renderCart() {
  if (!elements.cartItems) return;
  if (!cart.length) elements.cartItems.innerHTML = '<div class="empty-cart"><strong>Tu pedido está vacío.</strong><p>Agregá al menos una curva para continuar.</p></div>';
  else elements.cartItems.innerHTML = cart.map(item => { const product=findProduct(item.productId); const curve=findCurve(product,item.curveId); return `<article class="cart-item"><div class="cart-item-head"><div><h3>${product.name}</h3><p><strong>${product.code}</strong> · Curva ${curve.label}</p></div><button class="remove-item" type="button" data-remove="${item.key}" aria-label="Eliminar ${product.name}, curva ${curve.label}">Eliminar</button></div><p class="cart-composition">${compositionText(curve)}</p><div class="cart-item-bottom"><div class="cart-quantity"><button type="button" data-cart-qty="minus" data-key="${item.key}" aria-label="Restar una curva">−</button><span aria-label="${item.quantity} curvas">${item.quantity}</span><button type="button" data-cart-qty="plus" data-key="${item.key}" aria-label="Sumar una curva">+</button></div><div class="cart-line-total"><span>${item.quantity} curva${item.quantity>1?'s':''} · ${item.quantity*PAIRS_PER_CURVE} pares</span><strong>${ARS.format(item.quantity*curvePrice(product))}</strong></div></div></article>`; }).join('');
  const totals=getTotals();
  elements.cartCount.textContent=totals.curves; elements.cartCount.setAttribute('aria-label',`${totals.curves} curvas`);
  $('#summary-curves').textContent=totals.curves; $('#summary-pairs').textContent=totals.pairs; $('#summary-total').textContent=ARS.format(totals.total);
  elements.clearCart.hidden=!cart.length; elements.checkout.disabled=!cart.length;
}

function addToCart(productId) {
  const product=findProduct(productId); if (!product) return;
  const selected=document.querySelector(`input[name="curve-${product.id}"]:checked`); const curve=findCurve(product,selected?.value); if (!curve) return;
  const quantity=qtyByProduct[productId]; const key=`${productId}-${curve.id}`; const existing=cart.find(item=>item.key===key);
  if (existing) existing.quantity+=quantity; else cart.push({key,productId,curveId:curve.id,quantity});
  qtyByProduct[productId]=1; const output=$(`#qty-${productId}`); if(output) output.textContent='1';
  persistCart(); elements.cartCount.classList.remove('bump'); requestAnimationFrame(()=>elements.cartCount.classList.add('bump'));
  showToast(`${product.name} · Curva ${curve.label} agregada`);
}

function showToast(message) { if(!elements.toast)return; clearTimeout(toastTimer); elements.toast.textContent=message; elements.toast.classList.add('show'); toastTimer=setTimeout(()=>elements.toast.classList.remove('show'),2800); }

function focusable(container) { return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden && node.offsetParent!==null); }
function openDialog(root,panel,trigger) { returnFocus=trigger||document.activeElement; root.classList.add('open'); root.setAttribute('aria-hidden','false'); document.body.classList.add('dialog-open'); activeDialog={root,panel}; requestAnimationFrame(()=>{ const targets=focusable(panel); (targets[0]||panel).focus(); }); }
function closeDialog(root,triggerRestore=true) { root.classList.remove('open'); root.setAttribute('aria-hidden','true'); if(activeDialog?.root===root)activeDialog=null; if(!$('.cart-drawer.open')&&!$('.modal.open'))document.body.classList.remove('dialog-open'); if(triggerRestore&&returnFocus instanceof HTMLElement){ (returnFocus.disabled ? ($('#go-products') || document.body) : returnFocus).focus(); returnFocus=null; } }
function openCart() { elements.openCart.setAttribute('aria-expanded','true'); openDialog(elements.cart,elements.cartPanel,elements.openCart); }
function closeCart(restore=true) { elements.openCart.setAttribute('aria-expanded','false'); closeDialog(elements.cart,restore); }
function openCheckout() { if(!cart.length){showToast('Agregá al menos una curva al pedido.');return;} closeCart(false); const totals=getTotals(); elements.preview.replaceChildren(); const strong=document.createElement('strong'); strong.textContent=`${totals.curves} curvas · ${totals.pairs} pares`; const total=document.createElement('span'); total.textContent=`Total estimado: ${ARS.format(totals.total)}`; elements.preview.append(strong,total); elements.form.hidden=false; elements.success.hidden=true; elements.status.textContent=''; openDialog(elements.modal,elements.modalCard,elements.checkout); }
function closeCheckout() { if(isSubmitting)return; closeDialog(elements.modal); }

function formDataObject(form) { return Object.fromEntries([...new FormData(form).entries()].map(([key,value])=>[key,String(value).trim()])); }
function validate(data) {
  const errors={}; const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/; const phone=/^[\d\s()+.-]{6,40}$/;
  if(data.name.length<2)errors.name='Ingresá un nombre válido.'; if(data.company.length<2)errors.company='Ingresá el nombre del comercio.'; if(!phone.test(data.phone))errors.phone='Ingresá un teléfono válido.'; if(!email.test(data.email))errors.email='Ingresá un correo válido.'; if(data.province.length<2)errors.province='Ingresá la provincia.'; if(data.city.length<2)errors.city='Ingresá la localidad.'; if(data.notes.length>600)errors.notes='Máximo 600 caracteres.'; return errors;
}
function showErrors(errors) { document.querySelectorAll('.field-error').forEach(node=>{node.textContent='';}); elements.form.querySelectorAll('[aria-invalid="true"]').forEach(node=>node.removeAttribute('aria-invalid')); Object.entries(errors).forEach(([name,message])=>{const input=elements.form.elements[name]; const error=$(`[data-error-for="${name}"]`); if(input)input.setAttribute('aria-invalid','true'); if(error)error.textContent=message;}); const first=elements.form.querySelector('[aria-invalid="true"]'); if(first)first.focus(); }

async function submitOrder(event) {
  event.preventDefault(); if(isSubmitting)return; const data=formDataObject(elements.form); const errors=validate(data); showErrors(errors); if(Object.keys(errors).length){elements.status.textContent='Revisá los campos señalados.';elements.status.className='submit-status error';return;}
  const button=elements.form.querySelector('[type="submit"]'); isSubmitting=true; button.disabled=true; button.textContent='Enviando pedido…'; elements.status.textContent='Enviando el pedido y la copia de confirmación…'; elements.status.className='submit-status sending';
  const orderSnapshot=cart.map(item=>({...item})); const totals=getTotals();
  try { await sendOrderEmails(data,orderSnapshot,totals); cart=[]; persistCart(); elements.form.reset(); elements.form.hidden=true; elements.success.hidden=false; elements.status.textContent=''; elements.success.focus(); }
  catch(error){ console.error('No se pudo enviar el pedido:',error); elements.status.textContent='No pudimos completar ambos envíos. El pedido sigue guardado; intentá nuevamente.'; elements.status.className='submit-status error'; }
  finally { isSubmitting=false; button.disabled=false; button.textContent='Confirmar y enviar pedido'; }
}

document.addEventListener('click',event=>{
  const qty=event.target.closest('[data-qty]'); if(qty){const id=qty.dataset.product;if(findProduct(id)){qtyByProduct[id]=Math.max(1,qtyByProduct[id]+(qty.dataset.qty==='plus'?1:-1));const out=$(`#qty-${id}`);if(out)out.textContent=qtyByProduct[id];}}
  const add=event.target.closest('[data-add]'); if(add)addToCart(add.dataset.add);
  const remove=event.target.closest('[data-remove]'); if(remove){cart=cart.filter(item=>item.key!==remove.dataset.remove);persistCart();}
  const cartQty=event.target.closest('[data-cart-qty]'); if(cartQty){const item=cart.find(entry=>entry.key===cartQty.dataset.key);if(item){item.quantity=Math.max(1,item.quantity+(cartQty.dataset.cartQty==='plus'?1:-1));persistCart();}}
  if(event.target.matches('.drawer-backdrop,[data-close-cart]'))closeCart(); if(event.target.matches('.modal-backdrop,[data-close-checkout]'))closeCheckout();
});
document.addEventListener('change',event=>{if(!event.target.matches('input[type="radio"][name^="curve-"]'))return; const product=findProduct(event.target.name.replace('curve-',''));const curve=findCurve(product,event.target.value);const box=$(`#composition-${product?.id}`);if(curve&&box)box.innerHTML=`<strong>Composición:</strong> ${compositionText(curve)}`;});
document.addEventListener('keydown',event=>{if(!activeDialog)return;if(event.key==='Escape'){event.preventDefault();activeDialog.root===elements.cart?closeCart():closeCheckout();return;}if(event.key==='Tab'){const targets=focusable(activeDialog.panel);if(!targets.length)return;const first=targets[0],last=targets[targets.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});

elements.openCart?.addEventListener('click',openCart); $('#go-products')?.addEventListener('click',()=>$('#productos')?.scrollIntoView()); elements.checkout?.addEventListener('click',openCheckout); $('#continue-shopping')?.addEventListener('click',()=>closeCart()); elements.clearCart?.addEventListener('click',()=>{if(cart.length&&window.confirm('¿Querés vaciar todo el pedido?')){cart=[];persistCart();}}); elements.form?.addEventListener('submit',submitOrder); $('#success-close')?.addEventListener('click',()=>closeDialog(elements.modal));

cart=loadCart(); renderProducts(); renderCart();
