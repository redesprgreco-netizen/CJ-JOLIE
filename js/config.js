/* ============================================================
   CONFIGURACIÓN GJ JOLI — edita aquí lo que cambie con el tiempo
   ============================================================ */
window.GJ = window.GJ || {};

GJ.config = {
  whatsapp: '527779969860',   // Número de WhatsApp de la tienda: código de país + número, sin + ni espacios
  pin: '1234',                // PIN del panel interno (admin.html). Cámbialo antes de publicar.
  shopName: 'GJ Joli',
  email: 'gjjolie.bonitas@gmail.com',
  phoneLabel: '777 996 9860'
};

GJ.WINDOWS = ['Por definir', '9:00–13:00', '13:00–17:00', '17:00–20:00'];
GJ.PAYMENTS = ['Transferencia', 'Efectivo al entregar', 'Tarjeta (confirmar por WhatsApp)'];

/* Productos. PRECIOS DE EJEMPLO: cámbialos por los reales. */
GJ.products = [
  { id:'cb-negro',  name:'Crossbody Collection', color:'Negro',  hex:'#1f1c1e', price:1890, desc:'20 × 14 × 10 cm', img:'assets/negro.jpg',  glb:'assets/bolso-negro.glb' },
  { id:'cb-rojo',   name:'Crossbody Collection', color:'Rojo',   hex:'#c4182a', price:1890, desc:'20 × 14 × 10 cm', img:'assets/rojo.jpg',   glb:'assets/bolso-rojo.glb' },
  { id:'cb-rosa',   name:'Crossbody Collection', color:'Rosa',   hex:'#e9a3a6', price:1890, desc:'20 × 14 × 10 cm', img:'assets/rosa.jpg',   glb:'assets/bolso-rosa.glb' },
  { id:'cb-blanco', name:'Crossbody Collection', color:'Blanco', hex:'#efeeea', price:1890, desc:'20 × 14 × 10 cm', img:'assets/blanco.jpg', glb:'assets/bolso-blanco.glb' },
  { id:'cb-beige',  name:'Crossbody Collection', color:'Beige',  hex:'#d9c9ad', price:1890, desc:'20 × 14 × 10 cm', img:'assets/beige.jpg',  glb:'assets/bolso-beige.glb' },
  { id:'cb-cafe',   name:'Crossbody Collection', color:'Café',   hex:'#8a4b24', price:1890, desc:'20 × 14 × 10 cm', img:'assets/cafe.jpg',   glb:'assets/bolso-cafe.glb' }
];

/* Zonas de entrega iniciales. Se administran desde el panel interno (Zonas). */
GJ.defaultZones = [
  { id:'z-local', name:'Zona local', type:'local', fee:49, days:'Lunes a sábado · 10:00–19:00',
    places:['Colonia Ejemplo Centro', 'Colonia Ejemplo Norte'] },
  { id:'z-didi',  name:'Zona DiDi',  type:'didi',  fee:120, days:'Entrega el mismo día, sujeta a disponibilidad',
    places:['Colonia Ejemplo Sur'] }
];

