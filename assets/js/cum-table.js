/* stock-table.js - versión PROD por día */

(function () {
  const tbody = document.getElementById('monthly-data');
  const btnGuardar = document.getElementById('btn-guardar');
  const btnAgregar = document.getElementById('btn-agregar');
  const btnLimpiar = document.getElementById('btn-limpiar');

  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const subCols = ['PROD']; // Solo PROD

  const productosFijos = [
    { nombre: 'EA888 EVO', meta: '2 hrs' },
    { nombre: 'EA888 BZ', meta: '2 hrs' },
    { nombre: 'EA888 Serie', meta: '2 hrs' },
    { nombre: 'EA211', meta: '2 hrs' }
  ];

// --- Inyectar CSS exclusivo de la tabla ---
const style = document.createElement('style');
style.innerHTML = `
  #monthly-data { table-layout: fixed; width: 100%; border-collapse: collapse; }
  #monthly-data th, #monthly-data td { border: 1px solid #ccc; padding: 0.5rem; box-sizing: border-box; vertical-align: middle; }
  .producto-cell { min-width: 150px; max-width: 180px; white-space: normal; word-wrap: break-word; text-align: left; font-weight: 700; }
  .day-cell { min-width: 50px; text-align: center; }
  #monthly-data td[contenteditable="true"] { outline: none; background-color: #fff; }
  .meta-line { font-weight: 400; font-size: 0.85rem; color: #333; display: block; }
  .shaded td { background: #f5f5f5; }
  .day-header { text-align: center; font-weight: 600; }

  /* Centrar los encabezados de días horizontal y verticalmente */
  #monthly-data thead th {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center !important;
      vertical-align: middle !important;
  }
`;
document.head.appendChild(style);
  // --- Helpers ---
  function escapeHtml(text){ if(text==null||text==undefined) return ''; return String(text).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function enableSaveIfHasRows(){ btnGuardar.disabled = tbody.children.length===0; }
  function makeCell(value='', className='', editable=true){ const td=document.createElement('td'); if(className) td.className=className; td.contentEditable=String(!!editable); td.innerText=value==null?'':value; return td; }

  // --- Agregar fila ---
  function addRow(productoObj, datosDias={}) {
    const tr = document.createElement('tr');
    if(tbody.children.length % 2===0) tr.classList.add('shaded');

    // Columna Producto
    const tdProd = document.createElement('td');
    tdProd.className='producto-cell';
    tdProd.contentEditable=false;
    tdProd.innerHTML=`<div>${escapeHtml(productoObj.nombre)}</div>`+
                     `<div class="meta-line">Meta: ${escapeHtml(productoObj.meta)}</div>`;
    tr.appendChild(tdProd);

    // Columnas PROD por día
    dias.forEach(d => {
      const td = makeCell(datosDias[d]?.PROD || '', 'day-cell', true);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
    enableSaveIfHasRows();
    return tr;
  }

  function clearTableBody(){ tbody.innerHTML=''; enableSaveIfHasRows(); }

  // --- Cargar Excel ---
  async function cargarExcel(){
    try{
      const resp = await fetch('https://docs.google.com/spreadsheets/d/1m-f0OTYfX43cAVRw1QROkwVxW2HffKBp/gviz/tq?tqx=out:csv');
      const arrayBuffer = await resp.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type:'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header:1, defval:'' });

      clearTableBody();

      for(let i=0;i<productosFijos.length;i++){
        const rowExcel = rows[i+1] || [];
        const datosDias = {};
        dias.forEach((d, idx) => {
          datosDias[d] = { PROD: rowExcel[idx+1] || '' }; // Solo PROD
        });
        addRow(productosFijos[i], datosDias);
      }
    }catch(err){
      console.error('Error cargando Excel:',err);
      clearTableBody();
      productosFijos.forEach(p=>addRow(p));
    }
  }

  cargarExcel();

  // --- Exportar Excel ---
  btnGuardar.addEventListener('click', function(){
    const header = ['Producto', ...dias]; // Solo PROD
    const aoa = [header];
    for(const tr of tbody.children){
      const cells = Array.from(tr.children).map(td=>td.innerText.trim());
      aoa.push(cells.slice(0, 1 + dias.length)); // Producto + 7 PROD
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' });
    const blob = new Blob([wbout], { type:'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download='cumplimiento.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  btnAgregar.addEventListener('click', ()=>addRow({nombre:'Nuevo Producto',meta:''},{}));
  btnLimpiar.addEventListener('click', ()=>{ if(!confirm('¿Limpiar la tabla?')) return; clearTableBody(); productosFijos.forEach(p=>addRow(p)); });
  tbody.addEventListener('input', enableSaveIfHasRows);

})();
