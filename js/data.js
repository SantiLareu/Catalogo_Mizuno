export const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
export const PAIRS_PER_CURVE = 12;
export const STORAGE_KEY = 'realstep-cart';

const dama = Object.freeze([
  { size: '36', quantity: 2 }, { size: '37', quantity: 2 }, { size: '38', quantity: 2 },
  { size: '39', quantity: 2 }, { size: '39.5', quantity: 2 }, { size: '40', quantity: 2 },
]);
const hombreStandard = Object.freeze([
  { size: '41', quantity: 1 }, { size: '41.5', quantity: 1 }, { size: '42', quantity: 2 },
  { size: '43', quantity: 2 }, { size: '43.5', quantity: 2 }, { size: '44', quantity: 2 }, { size: '45', quantity: 2 },
]);
const hombreExtended = Object.freeze([
  { size: '39.5', quantity: 1 }, { size: '40', quantity: 1 }, { size: '41', quantity: 1 },
  { size: '41.5', quantity: 1 }, { size: '42', quantity: 1 }, { size: '43', quantity: 2 },
  { size: '43.5', quantity: 2 }, { size: '44', quantity: 1 }, { size: '45', quantity: 1 }, { size: '46', quantity: 1 },
]);

export const products = Object.freeze([
  { id:'enforce-060', page:2, name:'Wave Enforce Tour 2 CC', code:'61GC2504-060', color:'White / Baritone Blue / Fiery Coral 2', price:162104.68, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreStandard}] },
  { id:'enforce-005', page:3, name:'Wave Enforce Tour 2 CC', code:'61GC2504-005', color:'Odyssey Gray / White / Baritone Blue', price:162104.68, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreExtended}] },
  { id:'exceed-005', page:4, name:'Wave Exceed Court CC', code:'61GC2520-005', color:'Odyssey Gray / White / Blue Granite', price:115788.89, curves:[{id:'hombre',label:'Hombre',composition:hombreExtended}] },
  { id:'break-060', page:5, name:'Break Shot 5 CC', code:'61GC2525-060', color:'White / Calypso Coral / Citrus', price:69473.11, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreStandard}] },
  { id:'break-005', page:6, name:'Break Shot 5 CC', code:'61GC2525-005', color:'Odyssey Gray / White / Blue Granite', price:69473.11, curves:[{id:'dama',label:'Dama',composition:dama},{id:'hombre',label:'Hombre',composition:hombreStandard}] },
]);

export const curvePrice = product => product.price * PAIRS_PER_CURVE;
export const compositionText = curve => curve.composition.map(({ size, quantity }) => `${size} (${quantity})`).join(' · ');
export const findProduct = id => products.find(product => product.id === id);
export const findCurve = (product, id) => product?.curves.find(curve => curve.id === id);
