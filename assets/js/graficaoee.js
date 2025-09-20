document.addEventListener('DOMContentLoaded', function () {
  const archivoRuta = "https://docs.google.com/spreadsheets/d/1vC-21miKpoU7ijKsZMyhz0QsgEOhwcWV/gviz/tq?tqx=out:csv&sheet=Hoja1";

  document.getElementById('loadingMessage').style.display = 'block';

  fetch(archivoRuta)
    .then(response => {
      if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${response.statusText}`);
      return response.arrayBuffer();
    })
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Filtrar por línea
      const datosEA211 = jsonData.filter(row => row.Linea === 'EA211');
      const datosEA888 = jsonData.filter(row => row.Linea === 'EA888');

      // Registrar plugin datalabels
      if (typeof Chart !== 'undefined' && Chart.register) {
        Chart.register(ChartDataLabels);
      }

      function crearGrafico(canvasId, datos, titulo) {
        const labels = datos.map(row => row.Fecha);
        const disponibilidad = datos.map(row => parseFloat(row.Disponibilidad) || 0);
        const rendimiento = datos.map(row => parseFloat(row.Rendimiento) || 0);
        const calidad = datos.map(row => parseFloat(row.Calidad) || 0);
        const oee = datos.map(row => parseFloat(row.OEE) || 0);

        new Chart(document.getElementById(canvasId).getContext('2d'), {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'OEE', data: oee, backgroundColor: 'rgba(24, 79, 228, 0.8)', stack: 'Stack 1' },
              { label: 'Disponibilidad', data: disponibilidad, backgroundColor: 'rgba(54, 162, 235, 0.8)', stack: 'Stack 1' },
              { label: 'Desempeño', data: rendimiento, backgroundColor: 'rgba(236, 107, 20, 0.8)', stack: 'Stack 1' },
              { label: 'Calidad', data: calidad, backgroundColor: 'rgba(25, 139, 50, 0.66)', stack: 'Stack 1' }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              datalabels: {
                display: function (context) {
                  const val = context.dataset.data[context.dataIndex] || 0;
                  return val >= 3; // solo mostrar si el valor >= 3%
                },
                formatter: function (value) {
                  if (!value && value !== 0) return '';
                  const rounded = (Math.abs(value - Math.round(value)) >= 0.05)
                    ? value.toFixed(1)
                    : Math.round(value);
                  return rounded + '%';
                },
                font: {
                  weight: '600',
                  size: 12
                },
                anchor: 'center',
                align: 'center',
                color: function (context) {
                  const bg = context.dataset.backgroundColor;
                  try {
                    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg);
                    if (m) {
                      const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
                      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                      return lum < 140 ? 'white' : 'black';
                    }
                  } catch (e) {}
                  return 'white';
                },
                clamp: true,
                padding: 2
              },
              title: {
                  display: true,
                  text: titulo,
                  font: {
                    size: 24,       // tamaño en píxeles (ajústalo a tu gusto)
                    //weight: 'bold'  // opcional, pone el texto en negrita
                  },
                  color: '#0000009f'     // opcional, color del título
                },

              tooltip: {
                callbacks: {
                  label: function (context) {
                    const v = context.parsed.y || 0;
                    return `${context.dataset.label}: ${v.toFixed(2)}%`;
                  }
                }
              },
              annotation: {
                annotations: {
                  lineaMeta: {
                    type: 'line',
                    yMin: 60,
                    yMax: 60,
                    borderColor: 'red',
                    borderWidth: 2,
                    borderDash: [6, 6],
                    label: {
                      content: 'Meta 60%',
                      enabled: true,
                      position: 'end',
                      backgroundColor: 'rgba(255, 0, 0, 0.7)',
                      color: 'white'
                    }
                  }
                }
              }
            },
            scales: {
              x: { stacked: true, title: { display: true, text: 'Fecha' } },
              y: {
                stacked: true,
                title: { display: true, text: 'Porcentaje (%)' },
                min: 0,
                max: 100,
                ticks: { callback: value => value + '%' }
              }
            }
          }
        });
      }

      crearGrafico('graficoEA211', datosEA211, 'OEE - EA211');
      crearGrafico('graficoEA888', datosEA888, 'OEE - EA888');

      document.getElementById('loadingMessage').style.display = 'none';
    })
    .catch(error => {
      console.error(error);
      document.getElementById('loadingMessage').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    });
});
