# RealStep · Catálogo mayorista Mizuno Pádel 2026

Sitio estático en HTML, CSS y JavaScript puro para armar pedidos mayoristas por curvas. Conserva el carrito en `localStorage` y envía un correo interno más una copia al cliente mediante EmailJS. No procesa pagos ni confirma la operación comercial.

## Estructura

```text
index.html                 Interfaz, metadatos y datos configurables del footer
styles.css                 Diseño, responsive y accesibilidad
js/data.js                 Productos, precios, curvas y funciones puras
js/email.js                Configuración, HTML seguro y envíos de EmailJS
js/app.js                  Estado, carrito, interfaz, formulario y eventos
assets/Real_Step_logo.jpeg Logo de RealStep
assets/pages/page-1.png    Portada
assets/pages/page-2.png…6  Fichas de los cinco productos
```

## Ejecutar localmente

Los módulos ES requieren servir la carpeta por HTTP; abrir `index.html` directamente puede ser bloqueado por el navegador.

```powershell
cd Catalogo_Mizuno\realstep-mizuno-prototype
jwebserver -b 127.0.0.1 -p 8000 -d .
```
```
python -m http.server 5500
```

Abrí `http://127.0.0.1:8000`. También sirve cualquier servidor estático equivalente.

## Editar el catálogo

- Productos, códigos, colores y número de página: `products` en `js/data.js`.
- Precio por par: propiedad `price`; el precio por curva se calcula como `price × 12`.
- Curvas y talles: arreglos `dama`, `hombreStandard` y `hombreExtended` en `js/data.js`. Cada composición debe sumar 12 pares.
- Páginas: reemplazá `assets/pages/page-1.png` a `page-6.png` manteniendo nombres y proporción. `page-1` es portada y Open Graph; `page-2` a `page-6` corresponden a los productos.
- Logo: reemplazá `assets/Real_Step_logo.jpeg` manteniendo la ruta, o actualizá sus referencias en `index.html`. El archivo actual es JPEG cuadrado con fondo oscuro.
- Footer: buscá `REEMPLAZAR_` en `index.html` y completá WhatsApp (solo números con código de país), correo e Instagram. La ubicación está escrita en el mismo bloque.

## Configurar EmailJS

La configuración pública está en `js/email.js`. Se conservaron `serviceId`, `templateId`, public key y destinatario existentes.

En la plantilla `template_as1l96o` configurá:

- To Email: `{{to_email}}`
- From Name: `Real Step`
- From Email: dirección predeterminada del servicio
- Reply To: `{{reply_to}}`
- Subject: `{{subject}}`
- Content (Code Editor): `{{{email_html}}}`

La public key de EmailJS no es un secreto: necesariamente queda visible en un frontend estático. Configurá dominios permitidos, límites de cuota y medidas antiabuso en EmailJS. Un sitio estático no puede ocultar completamente esta configuración; para controles avanzados hace falta un backend o una función serverless, fuera del alcance de este proyecto.

Los dos correos son solicitudes independientes. Si el interno se envía y la copia al cliente falla, el carrito se conserva para reintentar, pero ese reintento puede duplicar el correo interno. EmailJS tampoco reemplaza validaciones de stock ni aporta garantías transaccionales entre ambos envíos.

## Probar un pedido

1. Agregá al menos una curva y verificá curvas, pares y total.
2. Completá el formulario con un correo de prueba autorizado.
3. Confirmá que lleguen el correo interno y la copia al cliente con productos, código, color, curva, composición, cantidades, subtotales, total y datos del cliente.
4. Confirmá que el carrito se vacíe solo después de ambos envíos. Si cualquiera falla, debe conservarse.

Evitá envíos repetidos para no consumir la cuota. Para simularlos durante desarrollo, reemplazá temporalmente `sendOrderEmails` por una función que resuelva o rechace una promesa y revertí ese cambio antes de publicar.

Para limpiar manualmente el carrito, ejecutá en la consola del navegador:

```js
localStorage.removeItem('realstep-cart');
location.reload();
```

## Despliegue en Netlify

No requiere build, npm ni variables de entorno.

1. Publicá como directorio base `Catalogo_Mizuno/realstep-mizuno-prototype` (o subí el contenido de esa carpeta).
2. Dejá Build command vacío.
3. Usá `.` como Publish directory si esa carpeta ya es la base del sitio.
4. Agregá el dominio definitivo a los dominios permitidos de EmailJS.
5. Verificá rutas, metadatos, formulario y ambos correos en la URL final.

## Checklist previo a producción

- [ ] Reemplazar `REEMPLAZAR_WHATSAPP`, `REEMPLAZAR_EMAIL` y `REEMPLAZAR_INSTAGRAM`.
- [ ] Confirmar ubicación y datos comerciales del footer.
- [ ] Revisar los cinco productos, precios y composiciones (12 pares cada una).
- [ ] Confirmar destinatario y plantilla de EmailJS.
- [ ] Restringir dominios, cuota y antiabuso en EmailJS.
- [ ] Probar un único pedido completo en producción.
- [ ] Revisar móvil desde 320 px, teclado, foco, Escape y contraste.
- [ ] Confirmar que `assets/pages/page-1.png` sea adecuada para compartir en redes.
