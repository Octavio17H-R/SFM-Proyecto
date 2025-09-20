(async function () {
  'use strict';

  const today = new Date();
  const dia = today.getDate();
  const mes = today.toLocaleString('es-ES', { month: 'long' });

  // --- Links ---
  const CSV_LINKS = {
    "Diario": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxhauVDN2f_H2o7ng_Lm0d3Kaa68hoGpmhmAYK4RjZzzn--ob5nISC2VYVuRhyWw/pub?gid=558860578&single=true&output=csv",
    "ResumenMensual": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuIO4xTTpsF87JvaCG9ffCheTRtF3nDcRHSnCayeVg9u81zPLyb9hkU7DNMiYAvA/pub?gid=116613634&single=true&output=csv"
  };

  const hojas = [
    { nombre: 'EA888', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2U_7CbzKFoNtYV09vImTOHTzSPgt_OxnSy9EHULciUY89Eh9Dw8ZOEBjXM-QQJA/pub?gid=1280638525&single=true&output=csv' },
    { nombre: 'EA211', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2U_7CbzKFoNtYV09vImTOHTzSPgt_OxnSy9EHULciUY89Eh9Dw8ZOEBjXM-QQJA/pub?gid=1419452860&single=true&output=csv' }
  ];

  const CSV_LINKS_DESECHO = {
    "EA888": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHsqHccP2BdDmN8F5dMKC10KSjLsiVw73k7WzEi0zYKEelpeqFmHBiWvzSgHResw/pub?gid=1979686779&single=true&output=csv",
    "EA211": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHsqHccP2BdDmN8F5dMKC10KSjLsiVw73k7WzEi0zYKEelpeqFmHBiWvzSgHResw/pub?gid=422635422&single=true&output=csv"
  };

  const CSV_LINKS_STOCK = {
    "Corazones": "https://docs.google.com/spreadsheets/d/e/2PACX-1vToRl-z4_Nr9g9Y_-mB7kpl9vovFkjzyOwBc5KZxsOaVJ8CdQlM9ove6b4E1XZnIw/pub?gid=1819146551&single=true&output=csv"
  };

  // --- Función para CSV con manejo de errores ---
  async function fetchCSV(url, nombre='Archivo CSV') {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
      const text = await resp.text();
      const wb = XLSX.read(text, { type: 'string' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    } catch (error) {
      console.error(`Error al cargar ${nombre}:`, error);
      return [];
    }
  }

  // --- 1. Accidentes ---
  async function getAccidentesHoy() {
    const rows = await fetchCSV(CSV_LINKS.Diario, 'Accidentes Diario');
    if (!rows.length) return;

    const accidentes = rows.filter(r =>
      parseInt(r[0],10) === dia &&
      String(r[1]).toLowerCase() === mes.toLowerCase()
    );

    const elem = document.getElementById('accidentes-hoy');
    if (elem) elem.innerText = accidentes.length;
  }

  // --- 2. Productividad ---
  async function getProductividadHoyGrafica() {
    const datasets = [];
    for (const hoja of hojas) {
      const rows = await fetchCSV(hoja.url, `Productividad ${hoja.nombre}`);
      if (!rows.length) continue;

      const dataRows = rows.slice(1);
      const row = dataRows.find(r => parseInt(r[0], 10) === dia);
      if (!row) continue;

      datasets.push({
        label: hoja.nombre,
        data: [row[1]??0, row[2]??0, row[3]??0],
        backgroundColor: hoja.nombre==='EA888'?'rgba(54,162,235,0.6)':'rgba(255,99,132,0.6)',
        borderColor: hoja.nombre==='EA888'?'rgba(54,162,235,1)':'rgba(255,99,132,1)',
        borderWidth:1
      });
    }

    const ctx = document.getElementById('graficoProductividad')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type:'bar',
      data:{labels:['T1','T2','T3'], datasets},
      options:{
        responsive:true,
        plugins:{legend:{position:'top'}, title:{display:true,text:`Productividad del día ${dia} de ${mes}`}},
        scales:{y:{beginAtZero:true, ticks:{stepSize:5}}}
      }
    });
  }

  // --- 3. Desecho ---
  async function getDesechoHoyGrafica() {
    const datasets = [];
    for (const key of ['EA888','EA211']) {
      const rows = await fetchCSV(CSV_LINKS_DESECHO[key], `Desecho ${key}`);
      if (!rows.length) continue;

      const dataRows = rows.slice(1);
      const row = dataRows.find(r=>parseInt(r[0],10)===dia);
      if (!row) continue;

      datasets.push({
        label:key,
        data:[row[1]??0,row[2]??0,row[3]??0],
        backgroundColor:key==='EA888'?'rgba(75,192,192,0.6)':'rgba(255,206,86,0.6)',
        borderColor:key==='EA888'?'rgba(75,192,192,1)':'rgba(255,206,86,1)',
        borderWidth:1
      });
    }

    const ctx = document.getElementById('graficoDesecho')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx,{
      type:'bar',
      data:{labels:['T1','T2','T3'],datasets},
      options:{responsive:true, plugins:{legend:{position:'top'},title:{display:true,text:`Desecho del día ${dia} de ${mes}`}}, scales:{y:{beginAtZero:true,ticks:{stepSize:5}}}}
    });
  }

  // --- 4. Stock ---
  async function getStockSemana() {
    const rows = await fetchCSV(CSV_LINKS_STOCK.Corazones,'Stock Corazones');
    if (!rows.length) return;

    const productos = ['EA888 EVO','EA888 BZ','EA888 Serie','EA211'];
    const diaSemana = today.getDay();
    const diaIndex = diaSemana===0?6:diaSemana-1;

    productos.forEach((p,i)=>{
      const row = rows.find(r=>String(r[0]).toLowerCase().includes(p.toLowerCase()));
      if (!row) return;

      const dias = row.slice(1,8).map(v=>v??'');
      const fila = document.getElementById(`fila_stock_${i}`);
      if (!fila) return;
      fila.innerHTML=`<td>${p}</td>`;

      dias.forEach((d,idx)=>{
        const td=document.createElement('td');
        td.innerText=d;
        if(idx===diaIndex){td.style.backgroundColor='#d4edda';td.style.fontWeight='600';}
        fila.appendChild(td);
      });
    });
  }

  // --- 5. OEE ---
  async function getOeeMesTarjetas() {
    const rows = await fetchCSV(CSV_LINKS.ResumenMensual,'OEE Mensual');
    if(!rows.length){console.error('No se pudo cargar OEE Mensual'); return;}

    const mesLower = mes.toLowerCase();
    const rowEA211 = rows.find(r=>r[0].toString().toLowerCase()===mesLower && r[1].toString().trim()==='EA211');
    const rowEA888 = rows.find(r=>r[0].toString().toLowerCase()===mesLower && r[1].toString().trim()==='EA888');

    document.getElementById('oee_ea211').innerText = rowEA211 ? parseFloat(rowEA211[5]??0).toFixed(2)+'%' : '0%';
    document.getElementById('oee_ea888').innerText = rowEA888 ? parseFloat(rowEA888[5]??0).toFixed(2)+'%' : '0%';
  }

  // --- 6. Dinero Gastado ---
  async function actualizarDineroGastado() {
    const rows = await fetchCSV(CSV_LINKS_STOCK.Corazones,'Finanzas');
    if(!rows.length){console.error('No se pudo cargar Finanzas'); return;}

    let total = 0;
    rows.slice(1).forEach(r=>total+=Number(r[1]||0));
    const div = document.getElementById('valor-gastado');
    if(div) div.textContent = total.toLocaleString('en-US')+' USD';
  }

  // --- Ejecutar ---
  await getAccidentesHoy();
  await getProductividadHoyGrafica();
  await getDesechoHoyGrafica();
  await getStockSemana();
  await getOeeMesTarjetas();
  await actualizarDineroGastado();

})();
