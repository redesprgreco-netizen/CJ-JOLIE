# GJ Joli · Tienda web, carrito y panel interno

## Archivos
- `index.html`: tienda, carrito y pedido. Al enviar, abre WhatsApp con el pedido.
- `admin.html`: panel interno (pedidos, entregas por día, clientes, zonas de entrega, respaldo).
- `js/config.js`: **aquí editas** WhatsApp, PIN, productos, precios y zonas iniciales.
- `css/styles.css`: estilos de marca (Crimson Text, Montserrat, paleta del manual).

## Puesta en marcha
1. En `js/config.js` cambia `whatsapp` (código de país + número), `pin`, productos y precios.
2. Sustituye la ilustración del bolso (`GJ.bagSVG`) por fotografías cuando las tengas.
3. Sube la carpeta a cualquier hosting estático (Render Static Site, Netlify, Vercel o GitHub Pages).

## Zonas de entrega
- Panel interno → **Zonas de entrega**: escribe las colonias o lugares, uno por línea.
- Tipo **Local**: entrega propia. Tipo **DiDi**: envío con DiDi.
- Colonia fuera de todas las zonas: el pedido queda como **Por confirmar** (paquetería, caso extraordinario).
- En **Pedidos** eliges el método final y la fecha/horario. En **Entregas** ves la ruta por día, lista para imprimir.

## Importante sobre los datos
- Los pedidos y clientes se guardan en el **navegador** donde se usa (localStorage).
  Para usarlo desde varios equipos o no perder datos, descarga respaldos en **Respaldo** o conecta un backend (p. ej. Supabase).
- El PIN del panel es una protección básica de uso interno, no una seguridad de servidor.

## Novedades
- Carrusel con fotos reales, video en portada y visor 3D con realidad aumentada (RA).
- Los modelos 3D están en `assets/bolso-*.glb` (uno por color, escala real 20 × 14 × 10 cm).
- **La RA solo funciona con la página publicada en HTTPS** (Render, Netlify, etc.) y desde un celular
  (Android: Scene Viewer / iPhone: Quick Look). En computadora solo se ve el 3D.
- Los modelos son una versión simplificada; para mayor fidelidad (asa trenzada, solapa exacta) reemplaza los .glb por modelos escaneados.
