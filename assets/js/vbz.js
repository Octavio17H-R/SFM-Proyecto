// La ruta a tu archivo de Excel
const EXCEL_FILE_PATH = 'https://docs.google.com/spreadsheets/d/1OrBK4aqM3Fb7OKvlnXB1g0bxfmhvTRdc/export?format=xlsx';

// Referencia a la gráfica mensual en el HTML
const monthlyChartCanvas = document.getElementById('monthlyChart');
let monthlyChart = null;

// Espera a que el DOM esté cargado para iniciar
document.addEventListener('DOMContentLoaded', () => {
    // La hoja de Excel que se leerá por defecto
    const sheetName = 'vbz'; 
    loadExcelAndRender(sheetName);
});

async function loadExcelAndRender(sheetName) {
    try {
        // Carga el archivo de Excel
        const response = await fetch(EXCEL_FILE_PATH);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Busca la hoja de Excel
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            console.error(`No se encontró la hoja: ${sheetName}`);
            return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        jsonData.shift(); // Elimina el encabezado

        const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const costos = [];
        const budgets = [];

        // Itera sobre los datos del Excel para llenar los arrays
        for (let i = 0; i < 12; i++) {
            const row = jsonData[i] || [];
            costos.push(Number(row[1]) || 0);
            budgets.push(Number(row[2]) || 0);
        }

        // Crea o actualiza el gráfico mensual
        createOrUpdateMonthlyChart(costos, budgets, labels);

    } catch (error) {
        console.error("Error al cargar el archivo de Excel:", error);
    }
}

function createOrUpdateMonthlyChart(costos, budgets, labels) {
    const ctx = monthlyChartCanvas.getContext('2d');
    if (monthlyChart) monthlyChart.destroy();

    // Plugin personalizado para mostrar data labels
    const dataLabelPlugin = {
        id: 'dataLabelPlugin',
        afterDatasetsDraw(chart, easing) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (!meta || meta.hidden) return;

                meta.data.forEach((element, index) => {
                    // valor a mostrar (formateado)
                    const value = dataset.data[index];
                    // evitemos mostrar ceros si no queremos; comentar la siguiente línea si sí queremos ceros
                    // if (value === 0) return;

                    const dataString = (typeof value === 'number')
                        ? value.toLocaleString('en-US') // o 'es-MX' si prefieres formato mexicano
                        : String(value);

                    ctx.save();

                    // estilo del texto
                    ctx.font = '12px Arial';
                    ctx.fillStyle = '#2b2a2aff';       // color del texto
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    // posición: usamos tooltipPosition() para obtener x,y de referencia
                    const position = element.tooltipPosition ? element.tooltipPosition() : { x: element.x, y: element.y };

                    // offset vertical según tipo (barras queremos arriba; puntos queremos encima también)
                    const padding = 6;
                    const yPos = position.y - padding;

                    // si la dataset es tipo 'line' y quieres que el número esté arriba del punto, usamos same offset
                    ctx.fillText(dataString, position.x, yPos);

                    ctx.restore();
                });
            });
        }
    };

    // Registramos el plugin localmente al crear el chart
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Resultado',
                data: costos,
                backgroundColor: 'rgba(41, 112, 204, 0.7)',
            }, {
                label: 'Meta',
                data: budgets,
                type: 'line',
                borderColor: 'rgba(226, 121, 36, 0.74)',
                borderWidth: 2,
                fill: false,
                pointRadius: 4,
                tension: 0.1,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                // Aquí puedes desactivar leyenda/tooltips si lo deseas
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: v => v.toLocaleString('en-US')
                    }
                }
            }
        },
        plugins: [dataLabelPlugin]
    });
}
