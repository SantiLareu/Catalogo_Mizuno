# Real Step · Mizuno Pádel 2026 — Prototipo con EmailJS

## Uso

1. Abrí `index.html` con Chrome o Edge.
2. Agregá productos al pedido.
3. Completá los datos del cliente y confirmá.
4. Se envía un correo a Real Step y otro de confirmación al cliente.

## Configuración requerida en EmailJS

En la plantilla `template_as1l96o`:

- **To Email:** `{{to_email}}`
- **From Name:** `Real Step`
- **From Email:** usar la dirección predeterminada
- **Reply To:** `{{reply_to}}`
- **Subject:** `{{subject}}`
- **Content (Code Editor):** `{{{email_html}}}`

El navegador necesita conexión a Internet para cargar el SDK de EmailJS y enviar los correos.

> Este prototipo usa EmailJS desde el navegador. La versión definitiva debe usar un backend para mayor seguridad, control y trazabilidad.
