(async function() {
  'use strict';

  const metas = {
    'ea888': { '1er turno': 40, '2do turno': 36, '3er turno': 31 },
    'ea211': { '1er turno': 40, '2do turno': 36, '3er turno': 31 }
  };

  const coloresTurno = ['#008FFB', '#00E396', '#FEB019'];

  const chartsRoot = document.getElementById('charts-root');

  const hojas = [
    { nombre: 'ea888', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2U_7CbzKFoNtYV09vImTOHTzSPgt_OxnSy9EHULciUY89Eh9Dw8ZOEBjXM-QQJA/pub?gid=1280638525&single=true&output=csv' },
    { nombre: 'ea211', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2U_7CbzKFoNtYV09vImTOHTzSPgt_OxnSy9EHULciUY89Eh9Dw8ZOEBjXM-QQJA/pub?gid=1419452860&single=true&output=csv' }
  ];

  // Procesar CSV a números, reemplazando vacíos por 0
  function processExcelData(aoa) {
    const data = [];
    for (let i = 1; i < aoa.length; i++) {
      const row = aoa[i];
      const dia = parseInt(row[0], 10);
      if (isNaN(dia) || dia < 1 || dia > 31) continue;

      data.push({
        dia,
        turno1: parseFloat(row[1]) || 0,
        turno2: parseFloat(row[2]) || 0,
        turno3: parseFloat(row[3]) || 0

      });
    }
    return data;
  }

  // Renderizar gráfico por turno
  function renderTurnoGrafico(id, turno, data) {
    let container = document.getElementById(`chart_${id}_${turno}`);
    if (!container) {
      container = document.createElement('div');
      container.id = `chart_${id}_${turno}`;
      container.classList.add('chart-container');
      chartsRoot.appendChild(container);
    }

    if (data.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:red;">No hay datos para mostrar</p>';
      return;
    }

    const nombreTurno = turno === 1 ? '1er turno' : turno === 2 ? '2do turno' : '3er turno';
    const series = [{ name: nombreTurno, data: data.map(d => d['turno' + turno] ?? 0) }];
    const meta = metas[id][nombreTurno];

    const options = {
      series,
      chart: { height: 300, type: 'line', toolbar: { show: false } },
      stroke: { curve: 'smooth', width: 2 },
      markers: { size: 4 },
      dataLabels: { enabled: true },
      colors: [coloresTurno[turno - 1]],
      xaxis: { categories: data.map(d => d.dia), title: { text: 'Día' } },
      yaxis: { min: 0, max: 60, tickAmount: 6, title: { text: 'Piezas' } },
      annotations: {
        yaxis: [
          { y: meta, borderColor: '#F9C01C' },
          { y: 0, y2: meta, fillColor: '#ef4444', opacity: 0.15 },
          { y: meta, y2: 60, fillColor: '#22c55e', opacity: 0.15 }
        ]
      },
      tooltip: { y: { formatter: val => val + ' piezas' } },
      legend: { show: false }
    };

    new ApexCharts(container, options).render();
  }

  async function loadAndRenderCharts() {
    for (const hoja of hojas) {
      try {
        const response = await fetch(hoja.url);
        if (!response.ok) throw new Error(`No se pudo cargar la hoja ${hoja.nombre}`);
        const csvText = await response.text();
        const aoa = csvText.trim().split('\n').map(r => r.split(','));
        const data = processExcelData(aoa);

        renderTurnoGrafico(hoja.nombre, 1, data);
        renderTurnoGrafico(hoja.nombre, 2, data);
        renderTurnoGrafico(hoja.nombre, 3, data);

      } catch (error) {
        console.error(error);
        const msg = document.createElement('div');
        msg.style.color = 'red';
        msg.textContent = `No se pudo cargar la hoja "${hoja.nombre}".`;
        chartsRoot.appendChild(msg);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', loadAndRenderCharts);
})();
