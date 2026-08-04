import { ARS, PAIRS_PER_CURVE, compositionText, curvePrice, findCurve, findProduct } from './data.js';

export const EMAILJS_CONFIG = Object.freeze({ serviceId:'service_8o99xft', templateId:'template_as1l96o', publicKey:'y0YUw9SkckUUTgg1q', realStepEmail:'martin@marquevich.com' });
const REQUEST_DELAY_MS = 1150;

export function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function buildProductRows(cart) {
  return cart.map(item => {
    const product = findProduct(item.productId);
    const curve = findCurve(product, item.curveId);
    return `<tr><td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;vertical-align:top"><strong style="color:#0c2045">${escapeHtml(product.name)}</strong><br><span style="font-size:12px;color:#64748b">${escapeHtml(product.code)} · ${escapeHtml(product.color)}</span><br><span style="font-size:13px;color:#334155">Curva ${escapeHtml(curve.label)} · ${escapeHtml(compositionText(curve))}</span></td><td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;text-align:center;vertical-align:top">${item.quantity}</td><td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;text-align:center;vertical-align:top">${item.quantity * PAIRS_PER_CURVE}</td><td style="padding:16px 12px;border-bottom:1px solid #dfe5ee;text-align:right;vertical-align:top;font-weight:700;white-space:nowrap">${ARS.format(item.quantity * curvePrice(product))}</td></tr>`;
  }).join('');
}

export function buildEmailHtml(data, cart, totals, recipient) {
  const owner = recipient === 'owner';
  const name = escapeHtml(data.name);
  const customerBlock = owner ? `<div style="margin:24px 0;padding:18px;background:#f3f6fa;border-radius:10px"><h2 style="margin:0 0 12px;color:#0c2045;font-size:18px">Datos del cliente</h2><p><strong>Nombre:</strong> ${name}</p><p><strong>Comercio:</strong> ${escapeHtml(data.company)}</p><p><strong>Teléfono:</strong> ${escapeHtml(data.phone)}</p><p><strong>Correo:</strong> ${escapeHtml(data.email)}</p><p><strong>Ubicación:</strong> ${escapeHtml(data.city)}, ${escapeHtml(data.province)}</p><p><strong>Dirección:</strong> ${escapeHtml(data.address || '-')}</p></div>` : '';
  const title = owner ? 'Nuevo pedido recibido' : '¡Recibimos tu pedido!';
  const intro = owner ? 'Se registró un nuevo pedido desde el catálogo Mizuno Pádel 2026.' : `Hola ${name}, recibimos correctamente tu pedido. Un asesor de RealStep se comunicará con vos para coordinar la operación.`;
  return `<!doctype html><html lang="es"><body style="margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#17233a"><div style="max-width:760px;margin:0 auto;padding:24px 12px"><div style="background:#0c2045;padding:22px 26px;border-radius:14px 14px 0 0"><div style="color:#fff;font-size:24px;font-weight:800">REALSTEP</div><div style="color:#dbe5f4;font-size:12px;margin-top:4px;letter-spacing:1.5px">CATÁLOGO MAYORISTA</div></div><div style="background:#fff;padding:28px 26px;border-radius:0 0 14px 14px"><h1 style="margin:0;color:#0c2045;font-size:28px">${title}</h1><p style="font-size:15px;line-height:1.6;color:#475569">${intro}</p>${customerBlock}<h2 style="margin:26px 0 10px;color:#0c2045;font-size:18px">Detalle del pedido</h2><div style="overflow-x:auto"><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#0c2045;color:#fff"><th style="padding:12px;text-align:left">Producto</th><th style="padding:12px">Curvas</th><th style="padding:12px">Pares</th><th style="padding:12px;text-align:right">Subtotal</th></tr></thead><tbody>${buildProductRows(cart)}</tbody></table></div><div style="margin:22px 0 0 auto;max-width:330px;background:#f3f6fa;padding:18px;border-radius:10px"><p>Total de curvas: <strong>${totals.curves}</strong></p><p>Total de pares: <strong>${totals.pairs}</strong></p><p style="font-size:18px;color:#0c2045">Total estimado: <strong>${ARS.format(totals.total)}</strong></p></div><div style="margin-top:22px;padding:16px;border-left:4px solid #ef2424;background:#fff7f7"><strong>Observaciones</strong><br><span style="color:#475569;line-height:1.5">${escapeHtml(data.notes || 'Sin observaciones.')}</span></div></div></div></body></html>`;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function sendOrderEmails(data, cart, totals) {
  if (!window.emailjs) throw new Error('EmailJS no está disponible. Revisá la conexión a Internet.');
  window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, { to_email:EMAILJS_CONFIG.realStepEmail, reply_to:data.email, subject:`Nuevo pedido Real Step - ${data.company}`, email_html:buildEmailHtml(data,cart,totals,'owner'), customer_name:data.name });
  await delay(REQUEST_DELAY_MS);
  await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, { to_email:data.email, reply_to:EMAILJS_CONFIG.realStepEmail, subject:'Recibimos tu pedido - Real Step', email_html:buildEmailHtml(data,cart,totals,'customer'), customer_name:data.name });
}
