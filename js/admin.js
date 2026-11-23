(function(){
  const GJ = window.GJ, DB = GJ.DB, $ = s => document.querySelector(s);
  const STATUS = ['nuevo','confirmado','en ruta','entregado','cancelado'];
  const METHODS = { pendiente:'Por confirmar', local:'Entrega local', didi:'DiDi', paqueteria:'Paquetería' };
  const st = { tab:'pedidos', estado:'todos', rango:'semana', buscar:'' };

  const orders = () => DB.get('orders', []);
  const esc = GJ.esc, money = GJ.money, fmtDay = GJ.fmtDay;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const empty = (t, p) => `<div class="empty"><h3>${t}</h3><p class="muted">${p}</p></div>`;
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

  /* ---------- Acceso ---------- */
  function init(){
    if (sessionStorage.getItem('gj_admin') === '1') return showApp();
    $('#loginForm').addEventListener('submit', e => {
      e.preventDefault();
      if ($('#pin').value === String(GJ.config.pin)){
        sessionStorage.setItem('gj_admin','1'); showApp();
      } else {
        $('#loginErr').textContent = 'El PIN no coincide. Revísalo e inténtalo de nuevo.';
        $('#pin').select();
      }
    });
  }
  function showApp(){
    $('#login').hidden = true; $('#app').hidden = false;
    document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { st.tab = b.dataset.tab; render(); }));
    $('#view').addEventListener('click', onClick);
    $('#view').addEventListener('change', onChange);
    $('#view').addEventListener('input', onInput);
    $('#logout').addEventListener('click', () => { sessionStorage.removeItem('gj_admin'); location.reload(); });
    render();
  }

  function render(){
    document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === st.tab)));
    const views = { pedidos:viewPedidos, entregas:viewEntregas, clientes:viewClientes, zonas:viewZonas, respaldo:viewRespaldo };
    $('#view').innerHTML = views[st.tab]();
  }

  /* ---------- Pedidos ---------- */
  function waClient(o){
    const entrega = o.date ? ` Entrega programada: ${fmtDay(o.date)}${o.window && o.window !== 'Por definir' ? ', ' + o.window : ''}.` : '';
    return GJ.waLink(`Hola ${o.customer.name}, te escribimos de GJ Joli sobre tu pedido ${o.code}. Estado: ${o.status}.${entrega}`, o.customer.phone);
  }
  function orderCard(o){
    return `<article class="order" data-order="${esc(o.id)}">
      <div class="order-head"><div><strong>${esc(o.code)}</strong> · ${esc(o.customer.name)} <span class="muted">${esc(o.customer.phone)}</span></div><span class="pill">${esc(o.status)}</span></div>
      <p class="muted" style="margin-top:6px">${esc(o.customer.colonia)} · ${esc(o.customer.calle)}${o.customer.referencias ? ' · Ref: ' + esc(o.customer.referencias) : ''} · Zona: ${esc(o.zoneName || 'Fuera de zona')}</p>
      <ul class="items">${o.items.map(i => `<li>${i.qty} × ${esc(i.name)} · ${esc(i.color)}</li>`).join('')}</ul>
      <p class="muted">Total ${money(o.total)} · Pago: ${esc(o.payment)}${o.notes ? ' · Nota: ' + esc(o.notes) : ''}</p>
      <div class="grid-form">
        <label class="field">Estado<select name="status">${STATUS.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label class="field">Método de entrega<select name="method">${Object.entries(METHODS).map(([k,v]) => `<option value="${k}" ${k === o.method ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field">Fecha de entrega<input type="date" name="date" value="${esc(o.date || '')}"></label>
        <label class="field">Horario<select name="window">${GJ.WINDOWS.map(w => `<option ${w === o.window ? 'selected' : ''}>${w}</option>`).join('')}</select></label>
      </div>
      <div class="row-actions">
        <button class="btn" data-save="${esc(o.id)}">Guardar cambios</button>
        <a class="btn btn-outline" target="_blank" rel="noopener" href="${waClient(o)}">Escribir al cliente</a>
      </div>
    </article>`;
  }
  function viewPedidos(){
    const all = orders();
    const list = all.filter(o => st.estado === 'todos' || o.status === st.estado);
    return `<div class="panel">
      <div class="toolbar">
        <label class="field">Estado<select id="filtroEstado">${['todos', ...STATUS].map(s => `<option value="${s}" ${s === st.estado ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <span class="muted">${list.length} de ${all.length} pedido(s)</span>
      </div>
      ${list.length ? list.map(orderCard).join('')
        : empty(all.length ? 'Ningún pedido en este estado' : 'Aún no hay pedidos', all.length ? 'Cambia el filtro para ver otros pedidos.' : 'Cuando una clienta confirme su compra desde la tienda, aparecerá aquí.')}
    </div>`;
  }
  function saveOrder(id){
    const card = document.querySelector(`[data-order="${id}"]`);
    const list = orders(); const o = list.find(x => x.id === id);
    if (!card || !o) return;
    o.status = card.querySelector('[name=status]').value;
    o.method = card.querySelector('[name=method]').value;
    o.date = card.querySelector('[name=date]').value;
    o.window = card.querySelector('[name=window]').value;
    DB.set('orders', list);
    GJ.toast(`Pedido ${o.code} guardado`);
    render();
  }

  /* ---------- Entregas (ruta del día / semana) ---------- */
  function stop(o){
    return `<article class="stop">
      <div class="order-head"><time>${esc(o.window || 'Por definir')}</time><span class="pill">${esc(METHODS[o.method] || '')}</span></div>
      <p><strong>${esc(o.customer.colonia)}</strong> · ${esc(o.customer.calle)}</p>
      ${o.customer.referencias ? `<p class="muted">Ref: ${esc(o.customer.referencias)}</p>` : ''}
      <p class="muted">${esc(o.customer.name)} · ${esc(o.customer.phone)} · ${esc(o.code)} · ${esc(o.status)}</p>
    </article>`;
  }
  function viewEntregas(){
    const t = GJ.today(), end = addDays(t, 7);
    let list = orders().filter(o => o.status !== 'cancelado' && o.status !== 'entregado');
    if (st.rango === 'hoy') list = list.filter(o => o.date === t);
    else if (st.rango === 'semana') list = list.filter(o => o.date && o.date >= t && o.date <= end);
    list.sort((a,b) => (a.date || 'z').localeCompare(b.date || 'z') || GJ.WINDOWS.indexOf(a.window) - GJ.WINDOWS.indexOf(b.window));
    const groups = {};
    list.forEach(o => { const k = o.date || ''; (groups[k] = groups[k] || []).push(o); });
    const rangos = [['hoy','Hoy'],['semana','Próximos 7 días'],['todos','Todos']];
    const head = `<div class="toolbar">
      <div class="chips">${rangos.map(([k,l]) => `<button class="tab" data-rango="${k}" aria-pressed="${st.rango === k}">${l}</button>`).join('')}</div>
      <button class="btn btn-outline no-print" data-print>Imprimir ruta</button></div>`;
    if (!list.length) return `<div class="panel">${head}${empty('Sin entregas en este rango', 'Cuando un pedido tenga fecha de entrega, aparecerá aquí ordenado por día y horario.')}</div>`;
    const body = Object.keys(groups).sort((a,b) => (a || 'z').localeCompare(b || 'z'))
      .map(d => `<h3 class="day">${d ? cap(fmtDay(d)) : 'Sin fecha asignada'}</h3>${groups[d].map(stop).join('')}`).join('');
    return `<div class="panel">${head}${body}</div>`;
  }

  /* ---------- Clientes ---------- */
  function clientCard(c){
    return `<article class="order">
      <div class="order-head"><div><strong>${esc(c.name)}</strong> <span class="muted">${esc(c.phone)}</span></div>
        <span class="muted">${c.orderIds.length} pedido(s) · último: ${esc(fmtDay((c.last || '').slice(0,10)))}</span></div>
      <ul class="items">${c.addresses.map(a => `<li>${esc(a.colonia)} · ${esc(a.calle)}${a.referencias ? ' · ' + esc(a.referencias) : ''}</li>`).join('')}</ul>
      <label class="field">Notas internas<textarea id="note-${esc(c.phone)}" rows="2">${esc(c.notes || '')}</textarea></label>
      <div class="row-actions">
        <button class="btn" data-save-note="${esc(c.phone)}">Guardar nota</button>
        <a class="btn btn-outline" target="_blank" rel="noopener" href="${GJ.waLink('Hola ' + c.name + ', le escribimos de GJ Joli.', c.phone)}">WhatsApp</a>
      </div>
    </article>`;
  }
  function viewClientes(){
    const q = GJ.norm(st.buscar);
    const all = Object.values(DB.get('clients', {})).sort((a,b) => (b.last || '').localeCompare(a.last || ''));
    const list = all.filter(c => !q || GJ.norm(c.name + ' ' + c.phone + ' ' + c.addresses.map(a => a.colonia).join(' ')).includes(q));
    return `<div class="panel">
      <div class="toolbar">
        <label class="field">Buscar<input id="buscar" type="search" value="${esc(st.buscar)}" placeholder="Nombre, teléfono o colonia"></label>
        <span class="muted">${list.length} cliente(s)</span>
      </div>
      ${list.length ? list.map(clientCard).join('') : empty('Aún no hay clientes', 'Se guardan automáticamente cuando alguien hace un pedido.')}
    </div>`;
  }
  function saveNote(phone){
    const clients = DB.get('clients', {});
    if (!clients[phone]) return;
    clients[phone].notes = document.getElementById('note-' + phone).value;
    DB.set('clients', clients);
    GJ.toast('Nota guardada');
  }

  /* ---------- Zonas de entrega ---------- */
  function zoneCard(z){
    return `<article class="order" data-zone="${esc(z.id)}">
      <div class="form-grid">
        <label class="field">Nombre<input name="name" value="${esc(z.name)}"></label>
        <label class="field">Tipo<select name="type"><option value="local" ${z.type === 'local' ? 'selected' : ''}>Local</option><option value="didi" ${z.type === 'didi' ? 'selected' : ''}>DiDi</option></select></label>
        <label class="field">Costo de envío (MXN)<input name="fee" type="number" min="0" value="${Number(z.fee) || 0}"></label>
        <label class="field">Días y horario<input name="days" value="${esc(z.days || '')}"></label>
        <label class="field full">Colonias o lugares (uno por línea)<textarea name="places" rows="4">${esc((z.places || []).join('\n'))}</textarea></label>
      </div>
      <div class="row-actions">
        <button class="btn" data-save-zone="${esc(z.id)}">Guardar zona</button>
        <button class="btn btn-outline" data-del-zone="${esc(z.id)}">Eliminar</button>
      </div>
    </article>`;
  }
  function viewZonas(){
    return `<div class="panel">
      <div class="toolbar">
        <p class="muted" style="max-width:60ch">Aquí defines dónde entregas. Zona <strong>local</strong>: entrega propia. Zona <strong>DiDi</strong>: envío con DiDi. Si la colonia de la clienta no está en ninguna, el pedido queda como “por confirmar” (paquetería, casos extraordinarios).</p>
        <button class="btn btn-outline" data-add-zone>Agregar zona</button>
      </div>
      ${GJ.getZones().map(zoneCard).join('')}
    </div>`;
  }
  function saveZone(id){
    const card = document.querySelector(`[data-zone="${id}"]`);
    const list = GJ.getZones(); const z = list.find(x => x.id === id);
    if (!card || !z) return;
    z.name = card.querySelector('[name=name]').value.trim() || 'Zona';
    z.type = card.querySelector('[name=type]').value;
    z.fee = Number(card.querySelector('[name=fee]').value) || 0;
    z.days = card.querySelector('[name=days]').value.trim();
    z.places = card.querySelector('[name=places]').value.split('\n').map(s => s.trim()).filter(Boolean);
    DB.set('zones', list);
    GJ.toast(`Zona “${z.name}” guardada`);
    render();
  }
  function addZone(){
    const list = GJ.getZones();
    list.push({ id:GJ.uid(), name:'Nueva zona', type:'local', fee:0, days:'', places:[] });
    DB.set('zones', list); render();
  }
  function delZone(id){
    if (!confirm('¿Eliminar esta zona? Los pedidos existentes no se modifican.')) return;
    DB.set('zones', GJ.getZones().filter(z => z.id !== id)); render();
  }

  /* ---------- Respaldo ---------- */
  function viewRespaldo(){
    return `<div class="panel"><div class="order">
      <h3>Respaldo de datos</h3>
      <p class="muted" style="margin:8px 0 14px;max-width:60ch">Los datos se guardan en este navegador. Descarga un respaldo con frecuencia; también sirve para pasar la información a otra computadora.</p>
      <div class="row-actions">
        <button class="btn" data-exportar>Descargar respaldo (.json)</button>
        <label class="btn btn-outline" style="cursor:pointer">Importar respaldo<input id="importFile" type="file" accept="application/json" hidden></label>
      </div></div></div>`;
  }
  function exportar(){
    const data = { exportedAt:new Date().toISOString(), orders:orders(), clients:DB.get('clients',{}), zones:GJ.getZones(), counter:DB.get('counter',0) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], { type:'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `respaldo-gjjoli-${GJ.today()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function importar(file){
    const r = new FileReader();
    r.onload = () => {
      try{
        const d = JSON.parse(r.result);
        if (d.orders) DB.set('orders', d.orders);
        if (d.clients) DB.set('clients', d.clients);
        if (d.zones) DB.set('zones', d.zones);
        if (d.counter != null) DB.set('counter', d.counter);
        GJ.toast('Respaldo importado'); render();
      }catch(err){ GJ.toast('Ese archivo no parece un respaldo de GJ Joli.'); }
    };
    r.readAsText(file);
  }

  /* ---------- Delegación de eventos ---------- */
  function onClick(e){
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.save) return saveOrder(d.save);
    if (d.saveZone) return saveZone(d.saveZone);
    if (d.delZone) return delZone(d.delZone);
    if (d.addZone !== undefined) return addZone();
    if (d.saveNote) return saveNote(d.saveNote);
    if (d.exportar !== undefined) return exportar();
    if (d.print !== undefined) return window.print();
    if (d.rango){ st.rango = d.rango; render(); }
  }
  function onChange(e){
    if (e.target.id === 'filtroEstado'){ st.estado = e.target.value; render(); }
    if (e.target.id === 'importFile' && e.target.files[0]) importar(e.target.files[0]);
  }
  function onInput(e){
    if (e.target.id !== 'buscar') return;
    const pos = e.target.selectionStart;
    st.buscar = e.target.value; render();
    const el = $('#buscar'); el.focus(); el.setSelectionRange(pos, pos);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
