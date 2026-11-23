(function(){
  const GJ = window.GJ;

  /* Almacenamiento local del navegador (cada dispositivo guarda sus datos) */
  GJ.DB = {
    get(k, fb){
      try{
        const v = localStorage.getItem('gj_' + k);
        return v === null ? JSON.parse(JSON.stringify(fb)) : JSON.parse(v);
      }catch(e){ return JSON.parse(JSON.stringify(fb)); }
    },
    set(k, v){
      try{ localStorage.setItem('gj_' + k, JSON.stringify(v)); return true; }
      catch(e){ GJ.toast('No pudimos guardar en este navegador. Descarga un respaldo desde el panel interno.'); return false; }
    }
  };

  GJ.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  GJ.money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(n)||0);
  GJ.norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  GJ.digits = s => String(s||'').replace(/\D/g,'');
  GJ.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  GJ.today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  GJ.fmtDay = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'}) : 'Sin fecha';

  GJ.getZones = () => GJ.DB.get('zones', GJ.defaultZones);

  /* Busca la zona que contiene una colonia o lugar (coincidencia flexible, sin acentos) */
  GJ.findZone = place => {
    const p = GJ.norm(place);
    if (p.length < 3) return null;
    for (const z of GJ.getZones()){
      const hit = (z.places||[]).some(x => { const n = GJ.norm(x); return n.length >= 3 && (n === p || p.includes(n) || n.includes(p)); });
      if (hit) return z;
    }
    return null;
  };

  GJ.nextCode = () => { const n = GJ.DB.get('counter', 0) + 1; GJ.DB.set('counter', n); return 'GJ-' + String(n).padStart(4,'0'); };

  GJ.saveOrder = o => { const list = GJ.DB.get('orders', []); list.unshift(o); GJ.DB.set('orders', list); };

  GJ.upsertClient = o => {
    const key = GJ.digits(o.customer.phone);
    const clients = GJ.DB.get('clients', {});
    const c = clients[key] || { phone:key, name:'', notes:'', addresses:[], orderIds:[], last:null };
    c.name = o.customer.name;
    const a = { colonia:o.customer.colonia, calle:o.customer.calle, referencias:o.customer.referencias };
    if (!c.addresses.some(x => x.colonia === a.colonia && x.calle === a.calle)) c.addresses.push(a);
    c.orderIds.push(o.id);
    c.last = o.createdAt;
    clients[key] = c;
    GJ.DB.set('clients', clients);
  };

  GJ.buildMessage = o => {
    const c = o.customer;
    const lines = [
      `Hola GJ Joli, quiero hacer un pedido (${o.code}):`, '',
      ...o.items.map(i => `• ${i.qty} × ${i.name} · ${i.color} — ${GJ.money(i.price * i.qty)}`), '',
      `Subtotal: ${GJ.money(o.subtotal)}`,
      o.zoneName ? `Envío (${o.zoneName}): ${GJ.money(o.deliveryFee)}` : 'Envío: por confirmar (fuera de zona local)',
      o.zoneName ? `Total: ${GJ.money(o.total)}` : '',
      '',
      `Nombre: ${c.name}`,
      `Teléfono: ${c.phone}`,
      `Colonia / lugar: ${c.colonia}`,
      `Calle y número: ${c.calle}`,
      c.referencias ? `Referencias: ${c.referencias}` : null,
      `Fecha preferida: ${o.date ? GJ.fmtDay(o.date) : 'lo más pronto posible'}`,
      `Horario: ${o.window}`,
      `Pago: ${o.payment}`,
      o.notes ? `Notas: ${o.notes}` : null
    ].filter(x => x !== null && x !== '' || x === '');
    return lines.join('\n');
  };

  GJ.waLink = (text, phone) => {
    const d = GJ.digits(phone);
    const num = d ? (d.length === 10 ? '52' + d : d) : GJ.config.whatsapp;
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  };

  GJ.toast = msg => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(GJ._toastT);
    GJ._toastT = setTimeout(() => t.classList.remove('show'), 2800);
  };
})();
