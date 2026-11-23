(function(){
  const GJ = window.GJ, DB = GJ.DB, $ = s => document.querySelector(s);
  let zone = null;

  const cartItems = () => DB.get('cart', []);
  const subtotal = c => c.reduce((a,i) => a + i.price * i.qty, 0);
  const countItems = c => c.reduce((a,i) => a + i.qty, 0);
  const saveCart = c => { DB.set('cart', c); renderCart(); };

  /* ---------- Carrusel ---------- */
  const track = () => $('#track');
  function renderCarousel(){
    track().innerHTML = GJ.products.map((p,i) => `
      <article class="slide" aria-roledescription="diapositiva" aria-label="${i+1} de ${GJ.products.length}: ${GJ.esc(p.color)}">
        <div class="slide-photo"><img src="${p.img}" alt="Bolso ${GJ.esc(p.name)} color ${GJ.esc(p.color)}" loading="${i<2?'eager':'lazy'}" width="1000" height="650"></div>
        <div class="slide-info">
          <div><h3>${GJ.esc(p.color)}</h3><p class="muted">${GJ.esc(p.name)} · ${GJ.esc(p.desc)}</p></div>
          <strong>${GJ.money(p.price)}</strong>
        </div>
        <div class="slide-actions">
          <button class="btn" data-add="${p.id}">Agregar</button>
          <button class="btn btn-outline" data-view="${p.id}">Ver en 3D / RA</button>
        </div>
      </article>`).join('');
    $('#dots').innerHTML = GJ.products.map((p,i) => `<button data-dot="${i}" aria-label="Ir a ${GJ.esc(p.color)}"></button>`).join('');
    updateDots();
  }
  function slideW(){ const s = track().querySelector('.slide'); return s ? s.getBoundingClientRect().width + 20 : 300; }
  function go(dir){ track().scrollBy({ left: dir * slideW(), behavior:'smooth' }); }
  function updateDots(){
    const t = track(), i = Math.round(t.scrollLeft / slideW());
    document.querySelectorAll('#dots button').forEach((d,k) => d.setAttribute('aria-current', String(k === i)));
    $('#prev').disabled = t.scrollLeft < 8;
    $('#next').disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 8;
  }

  /* ---------- Visor 3D / RA ---------- */
  const viewer = $('#viewer');
  let viewing = null;
  function openViewer(id){
    const p = GJ.products.find(x => x.id === id); if (!p) return;
    viewing = p;
    $('#mv').src = p.glb;
    $('#mv').alt = `Modelo 3D del bolso ${p.color}`;
    $('#viewerColor').textContent = p.color;
    $('#viewerSwatches').innerHTML = GJ.products.map(x => `<button class="swatch" data-sw="${x.id}" style="background:${x.hex}" aria-label="${GJ.esc(x.color)}" aria-pressed="${x.id === p.id}"></button>`).join('');
    viewer.classList.add('open'); viewer.setAttribute('aria-hidden','false');
    setTimeout(() => $('#viewerClose').focus(), 50);
  }
  function closeViewer(){ viewer.classList.remove('open'); viewer.setAttribute('aria-hidden','true'); }

  /* ---------- Carrito ---------- */
  function renderCart(){
    const c = cartItems();
    $('#cartCount').textContent = countItems(c);
    $('#cartSubtotal').textContent = GJ.money(subtotal(c));
    $('#goCheckout').disabled = !c.length;
    $('#cartItems').innerHTML = c.length ? c.map(i => `
      <div class="line">
        <div class="line-art"><img src="${i.img}" alt=""></div>
        <div class="line-info">
          <strong>${GJ.esc(i.name)}</strong>
          <span class="muted">${GJ.esc(i.color)} · ${GJ.money(i.price)}</span>
          <div class="qty">
            <button data-dec="${i.id}" aria-label="Quitar uno de ${GJ.esc(i.color)}">−</button>
            <span aria-live="polite">${i.qty}</span>
            <button data-inc="${i.id}" aria-label="Agregar uno de ${GJ.esc(i.color)}">+</button>
            <button class="link" data-rm="${i.id}">Quitar</button>
          </div>
        </div>
      </div>`).join('')
    : `<div class="empty"><h3>Tu carrito está vacío</h3><p class="muted">Elige tu color favorito y aparecerá aquí.</p><a class="btn btn-outline" href="#catalogo" data-close>Ver colección</a></div>`;
  }

  function addToCart(id){
    const p = GJ.products.find(x => x.id === id); if (!p) return;
    const c = cartItems();
    const it = c.find(x => x.id === id);
    if (it) it.qty++; else c.push({ id:p.id, name:p.name, color:p.color, img:p.img, price:p.price, qty:1 });
    saveCart(c);
    GJ.toast(`${p.color} agregado al carrito`);
  }
  function changeQty(id, delta){
    let c = cartItems();
    const it = c.find(x => x.id === id); if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) c = c.filter(x => x.id !== id);
    saveCart(c);
  }
  function removeItem(id){ saveCart(cartItems().filter(x => x.id !== id)); }

  /* ---------- Paneles ---------- */
  const drawer = $('#cartDrawer'), overlay = $('#overlay'), modal = $('#checkout');

  function openDrawer(){
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false');
    overlay.classList.add('open'); $('#cartOpen').setAttribute('aria-expanded','true');
    $('#cartClose').focus();
  }
  function closeDrawer(){
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true');
    overlay.classList.remove('open'); $('#cartOpen').setAttribute('aria-expanded','false');
    $('#cartOpen').focus();
  }

  function openCheckout(){
    if (!cartItems().length) return;
    closeDrawer();
    renderSummary();
    $('#f-fecha').min = GJ.today();
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    zoneNotice();
    setTimeout(() => $('#f-nombre').focus(), 50);
  }
  function closeCheckout(){
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    $('#cartOpen').focus();
  }

  function trapFocus(e){
    const m = viewer.classList.contains('open') ? viewer : modal.classList.contains('open') ? modal : null;
    if (e.key !== 'Tab' || !m) return;
    const f = [...m.querySelectorAll('button,input,select,textarea,a[href]')].filter(el => !el.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length-1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  /* ---------- Checkout ---------- */
  function renderSummary(){
    const c = cartItems();
    $('#summaryLines').innerHTML = c.map(i => `<div class="row"><span>${i.qty} × ${GJ.esc(i.name)} · ${GJ.esc(i.color)}</span><span>${GJ.money(i.price*i.qty)}</span></div>`).join('');
    $('#sumSub').textContent = GJ.money(subtotal(c));
    updateTotals();
  }
  function updateTotals(){
    const sub = subtotal(cartItems());
    if (zone){
      $('#sumFee').textContent = GJ.money(zone.fee);
      $('#sumTotal').textContent = GJ.money(sub + Number(zone.fee));
    } else {
      $('#sumFee').textContent = 'Por confirmar';
      $('#sumTotal').textContent = GJ.money(sub) + ' + envío';
    }
  }

  function zoneNotice(){
    const box = $('#zoneNotice');
    const colonia = $('#f-colonia').value;
    if (!colonia.trim()){
      zone = null;
      box.className = 'notice';
      box.textContent = 'Escribe tu colonia o lugar para ver el costo de envío.';
    } else {
      zone = GJ.findZone(colonia);
      if (!zone){
        box.className = 'notice notice-warn';
        box.textContent = 'Esa colonia está fuera de nuestra zona de entrega habitual. Te confirmamos por WhatsApp si podemos enviarte con DiDi o paquetería.';
      } else if (zone.type === 'didi'){
        box.className = 'notice notice-ok';
        box.textContent = `${zone.name}: envío con DiDi por ${GJ.money(zone.fee)}. ${zone.days}.`;
      } else {
        box.className = 'notice notice-ok';
        box.textContent = `${zone.name}: entrega local por ${GJ.money(zone.fee)}. ${zone.days}.`;
      }
    }
    updateTotals();
  }

  const rules = [
    ['f-nombre', v => v.trim().length >= 2, 'Escribe tu nombre para identificar tu pedido.'],
    ['f-tel',    v => GJ.digits(v).length === 10, 'Necesitamos 10 dígitos para confirmar por WhatsApp.'],
    ['f-colonia',v => v.trim().length >= 3, 'Indícanos tu colonia o lugar de entrega.'],
    ['f-calle',  v => v.trim().length >= 3, 'Escribe calle y número para llegar sin perder tiempo.']
  ];
  function checkField(id, test, msg){
    const el = $('#' + id), err = $('#err-' + id.slice(2));
    const bad = !test(el.value);
    el.setAttribute('aria-invalid', String(bad));
    err.textContent = bad ? msg : '';
    return !bad;
  }
  function validate(){
    let ok = true, first = null;
    rules.forEach(([id,t,m]) => { if (!checkField(id,t,m)){ ok = false; first = first || $('#'+id); } });
    if (first) first.focus();
    return ok;
  }

  function buildOrder(){
    const c = cartItems(), sub = subtotal(c), fee = zone ? Number(zone.fee)||0 : 0;
    return {
      id: GJ.uid(), code: GJ.nextCode(), createdAt: new Date().toISOString(), status: 'nuevo',
      customer: {
        name: $('#f-nombre').value.trim(), phone: GJ.digits($('#f-tel').value),
        colonia: $('#f-colonia').value.trim(), calle: $('#f-calle').value.trim(),
        referencias: $('#f-ref').value.trim()
      },
      items: c.map(i => ({ id:i.id, name:i.name, color:i.color, price:i.price, qty:i.qty })),
      subtotal: sub,
      zoneId: zone ? zone.id : null, zoneName: zone ? zone.name : null, zoneType: zone ? zone.type : null,
      deliveryFee: fee, total: sub + fee,
      method: zone ? zone.type : 'pendiente',
      date: $('#f-fecha').value, window: $('#f-horario').value,
      payment: $('#f-pago').value, notes: $('#f-notas').value.trim()
    };
  }

  function submitOrder(e){
    e.preventDefault();
    if (!validate()) return;
    const order = buildOrder();
    GJ.saveOrder(order);
    GJ.upsertClient(order);
    const url = GJ.waLink(GJ.buildMessage(order));
    const win = window.open(url, '_blank', 'noopener');
    if (!win) location.href = url;
    saveCart([]);
    $('#checkoutForm').reset();
    closeCheckout();
    GJ.toast(`Pedido ${order.code} listo. Envíalo por WhatsApp para confirmarlo.`);
  }

  /* ---------- Eventos ---------- */
  function init(){
    renderCarousel(); renderCart();
    track().addEventListener('scroll', updateDots, { passive:true });
    window.addEventListener('resize', updateDots);
    $('#prev').addEventListener('click', () => go(-1));
    $('#next').addEventListener('click', () => go(1));
    $('#viewerClose').addEventListener('click', closeViewer);
    viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
    $('#year') && ($('#year').textContent = new Date().getFullYear());

    document.addEventListener('click', e => {
      const t = e.target.closest('button,a'); if (!t) return;
      if (t.dataset.add) return addToCart(t.dataset.add);
      if (t.dataset.view) return openViewer(t.dataset.view);
      if (t.dataset.sw) return openViewer(t.dataset.sw);
      if (t.dataset.dot) return track().scrollTo({ left: t.dataset.dot * slideW(), behavior:'smooth' });
      if (t.id === 'viewerAdd' && viewing){ addToCart(viewing.id); return closeViewer(); }
      if (t.dataset.inc) return changeQty(t.dataset.inc, 1);
      if (t.dataset.dec) return changeQty(t.dataset.dec, -1);
      if (t.dataset.rm) return removeItem(t.dataset.rm);
      if (t.dataset.close !== undefined) return closeDrawer();
    });

    $('#cartOpen').addEventListener('click', openDrawer);
    $('#cartClose').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    $('#goCheckout').addEventListener('click', openCheckout);
    $('#checkoutClose').addEventListener('click', closeCheckout);
    $('#checkoutBack').addEventListener('click', () => { closeCheckout(); openDrawer(); });
    modal.addEventListener('click', e => { if (e.target === modal) closeCheckout(); });

    $('#f-colonia').addEventListener('input', zoneNotice);
    $('#f-colonia').addEventListener('blur', zoneNotice);
    rules.forEach(([id,t,m]) => {
      const el = $('#'+id);
      el.addEventListener('blur', () => checkField(id,t,m));
      el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') checkField(id,t,m); });
    });

    $('#placesList').innerHTML = GJ.getZones().flatMap(z => z.places).map(p => `<option value="${GJ.esc(p)}">`).join('');
    $('#checkoutForm').addEventListener('submit', submitOrder);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape'){
        if (viewer.classList.contains('open')) closeViewer();
        else if (modal.classList.contains('open')) closeCheckout();
        else if (drawer.classList.contains('open')) closeDrawer();
      }
      trapFocus(e);
    });
    window.addEventListener('storage', renderCart);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
