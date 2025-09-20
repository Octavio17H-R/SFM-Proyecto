/* Plan de Acciones - Excel ↔ Tabla (con filtros por MES y AREA)
 * Requiere: XLSX (CDN en el HTML)
 * Lee:      Excel publicado como CSV desde Google Drive
 * Exporta:  plan_acciones_actualizado.xlsx
 */

(function () {
  // 🔽 Link público CSV de Drive
  const CSV_LINK = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSEAq-9ujFssw0fDgTKsZ5iAz6u8bdjuLZsG5O_MU6S452NcoZmM-psOwVGmZDGhg/pub?gid=291239436&single=true&output=csv';

  const COLS = ['MES','AREA','PROBLEMA','CAUSA','MEDIDA CORRECTIVA','ESCALAR','RESPONSABLE','PLAZO','ESTATUS'];
  const AREAS = ['Empleado','Proceso','Finanzas','Calidad'];
  const STORAGE_KEY = 'plan_acciones_tabla_v3';

  const $tbody      = document.getElementById('monthly-data');
  const $btnCargar  = document.getElementById('btn-cargar');
  const $btnGuardar = document.getElementById('btn-guardar');
  const $btnAgregar = document.getElementById('btn-agregar');
  const $btnLimpiar = document.getElementById('btn-limpiar');
  const $selMes     = document.getElementById('mes-select');
  const $selArea    = document.getElementById('area-select');

  if ($btnCargar)  $btnCargar.addEventListener('click', cargarCSV);
  if ($btnGuardar) $btnGuardar.addEventListener('click', exportarExcel);
  if ($btnAgregar) $btnAgregar.addEventListener('click', () => { agregarFila({}); marcarCambios(); });
  if ($btnLimpiar) $btnLimpiar.addEventListener('click', limpiarTabla);
  if ($selMes)     $selMes.addEventListener('change', aplicarFiltros);
  if ($selArea)    $selArea.addEventListener('change', aplicarFiltros);

  if ($tbody) {
    $tbody.addEventListener('input', (e) => {
      const td = e.target.closest('td');
      if (!td) return;
      if (td.dataset.col === 'MES')  td.textContent = normalizarMes(td.textContent || '');
      if (td.dataset.col === 'AREA') td.textContent = normalizarArea(td.textContent || '');
      marcarCambios();
      guardarLocal();
      aplicarFiltros();
    });
  }

  function marcarCambios() { if ($btnGuardar) $btnGuardar.disabled = false; }
  function limpiarTabla() { $tbody.innerHTML = ''; marcarCambios(); guardarLocal(); aplicarFiltros(); }
  function agregarFila(row) {
    const tr = document.createElement('tr');
    COLS.forEach(col => {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.dataset.col = col;
      td.textContent = (row[col] ?? '').toString();
      tr.appendChild(td);
    });
    $tbody.appendChild(tr);
  }

  function aplicarFiltros() {
    const mesFiltro  = ($selMes?.value || 'Todos').trim();
    const areaFiltro = ($selArea?.value || 'Todas').trim();
    [...$tbody.querySelectorAll('tr')].forEach(tr => {
      const mes  = (tr.querySelector('td[data-col="MES"]')?.textContent || '').trim();
      const area = (tr.querySelector('td[data-col="AREA"]')?.textContent || '').trim();
      tr.style.display = (mesFiltro==='Todos'||mes===mesFiltro) && (areaFiltro==='Todas'||area===areaFiltro) ? '' : 'none';
    });
  }

  function leerTablaAOA() {
    const aoa = [COLS];
    [...$tbody.querySelectorAll('tr')].forEach(tr => {
      const fila = COLS.map(c => (tr.querySelector(`td[data-col="${c}"]`)?.textContent || '').trim());
      if (fila.some(v=>v!=='')) aoa.push(fila);
    });
    return aoa;
  }

  async function cargarCSV() {
    try {
      const resp = await fetch(CSV_LINK + `&_=${Date.now()}`);
      if (!resp.ok) throw new Error('No se pudo cargar el CSV desde Drive.');
      const text = await resp.text();
      const rows = text.trim().split('\n').map(r => r.split(','));
      const headers = rows.shift().map(h => h.trim());
      $tbody.innerHTML = '';
      rows.forEach(r=>{
        const rowObj = {};
        COLS.forEach((col,i)=>{
          let val = r[i] ?? '';
          if (col==='MES') val = normalizarMes(val);
          if (col==='AREA') val = normalizarArea(val);
          rowObj[col] = val;
        });
        agregarFila(rowObj);
      });
      marcarCambios();
      guardarLocal();
      aplicarFiltros();
    } catch(e) {
      console.error(e);
      if(!cargarLocal()) alert(e.message);
      else aplicarFiltros();
    }
  }

  function exportarExcel() {
    const aoa = leerTablaAOA();
    const ws  = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      {wch:12},{wch:14},{wch:24},{wch:30},{wch:28},{wch:12},{wch:20},{wch:12},{wch:12}
    ];
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:aoa.length-1,c:COLS.length-1}}) };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    XLSX.writeFile(wb, 'plan_acciones_actualizado.xlsx');
    if ($btnGuardar) $btnGuardar.disabled = true;
  }

  function normalizarMes(m){ const t=(m||'').toString().trim().toLowerCase(); const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']; const idx=meses.indexOf(t); const limpio=idx>=0 ? meses[idx] : t; return limpio.charAt(0).toUpperCase()+limpio.slice(1);}
  function normalizarArea(a){ const t=(a||'').toString().trim().toLowerCase(); if(!t) return ''; const match=AREAS.find(x=>x.toLowerCase()===t); return match||(t.charAt(0).toUpperCase()+t.slice(1));}

  function guardarLocal() {
    const data = [...$tbody.querySelectorAll('tr')].map(tr=>{
      const fila = {};
      COLS.forEach(c=>fila[c]=(tr.querySelector(`td[data-col="${c}"]`)?.textContent||'').trim());
      return fila;
    }).filter(f=>Object.values(f).some(v=>v!==''));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({cols:COLS, rows:data, ts:Date.now()}));
  }

  function cargarLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return false;
      const {rows} = JSON.parse(raw);
      $tbody.innerHTML='';
      rows.forEach(agregarFila);
      if($btnGuardar) $btnGuardar.disabled=false;
      return true;
    } catch { return false; }
  }

  // Inicialización
  (function init(){
    if(!$tbody) return;
    if(!cargarLocal()) for(let i=0;i<12;i++) agregarFila({});
    aplicarFiltros();
  })();

})();
