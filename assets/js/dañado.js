// 🔽 Mapa de links por hoja/centro de costos
const CSV_LINKS = {
  "Corazones": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTYWFRKjR6mtsbkB4_jixp1AKamEIFkpaiVsAFUJ6T0ONOzHRgiVBSnv-MoWY8Xog/pub?gid=626189695&single=true&output=csv",
  "6103": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTYWFRKjR6mtsbkB4_jixp1AKamEIFkpaiVsAFUJ6T0ONOzHRgiVBSnv-MoWY8Xog/pub?gid=1617465412&single=true&output=csv",
  "6115": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTYWFRKjR6mtsbkB4_jixp1AKamEIFkpaiVsAFUJ6T0ONOzHRgiVBSnv-MoWY8Xog/pub?gid=655378047&single=true&output=csv",
  "6151": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTYWFRKjR6mtsbkB4_jixp1AKamEIFkpaiVsAFUJ6T0ONOzHRgiVBSnv-MoWY8Xog/pub?gid=1542857956&single=true&output=csv",
  "6150": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTYWFRKjR6mtsbkB4_jixp1AKamEIFkpaiVsAFUJ6T0ONOzHRgiVBSnv-MoWY8Xog/pub?gid=1023202003&single=true&output=csv",
};

// Referencias a los elementos de la tabla en el HTML
const costoRow = document.getElementById('costoRow');
const budgetRow = document.getElementById('budgetRow');
const totalCostoCell = document.getElementById('totalCosto');
const totalBudgetCell = document.getElementById('totalBudget');
const finalAnnualTotalCell = document.getElementById('finalAnnualTotal');
const annualBudgetValue = document.getElementById('annualBudgetValue');
const labels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

let monthlyChart = null;
let annualChart = null;

// 🔽 Agarro el select de Centro de Costos
const centroCostosSelect = document.getElementById("centroCostos");

// Espera a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  // Cargar el primer centro por defecto
  loadCSVAndRender(centroCostosSelect.value);

  // Cambiar cuando el usuario elige otro centro
  centroCostosSelect.addEventListener("change", () => {
    loadCSVAndRender(centroCostosSelect.value);
  });
});

async function loadCSVAndRender(sheetName) {
  try {
    const csvUrl = CSV_LINKS[sheetName];
    if(!csvUrl){
      alert(`No se encontró link CSV para: ${sheetName}`);
      return;
    }

    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error('No se pudo cargar la hoja CSV');
    const csvText = await response.text();

    const jsonData = csvText
      .trim()
      .split('\n')
      .map(row => row.split(','));

    // Elimina encabezado
    jsonData.shift();

    const costos = [];
    const budgets = [];
    let totalCosto2025 = 0;
    let totalBudget2025 = 0;

    for(let i=0; i<12; i++){
      const row = jsonData[i] || [];
      const costo = Number(row[1]) || 0;
      const budget = Number(row[2]) || 0;
      costos.push(costo);
      budgets.push(budget);
      totalCosto2025 += costo;
      totalBudget2025 += budget;

      costoRow.cells[i+1].textContent = costo.toLocaleString('en-US');
      budgetRow.cells[i+1].textContent = budget.toLocaleString('en-US');
    }

    totalCostoCell.textContent = totalCosto2025.toLocaleString('en-US');
    totalBudgetCell.textContent = totalBudget2025.toLocaleString('en-US');
    finalAnnualTotalCell.textContent = totalCosto2025.toLocaleString('en-US');
    annualBudgetValue.textContent = totalCosto2025.toLocaleString('en-US') + ' USD';

    createOrUpdateMonthlyChart(costos, budgets);
    createOrUpdateAnnualChart(totalCosto2025, totalBudget2025);

  } catch (error) {
    console.error("Error cargando CSV o renderizando datos:", error);
    alert("Error cargando la hoja: " + sheetName);
  }
}

function createOrUpdateMonthlyChart(costos, budgets){
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if(monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Costo USD',
          data: costos,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
        },
        {
          label: 'Budget',
          data: budgets,
          type: 'line',
          borderColor: 'rgba(255, 99, 132, 0.7)',
          borderWidth: 2,
          fill: false,
          pointRadius: 3,
          tension: 0.1,
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => '$' + v.toLocaleString('en-US')
          }
        }
      }
    }
  });
}

function createOrUpdateAnnualChart(totalCosto2025, totalBudget2025){
  const ctx = document.getElementById('annualChart').getContext('2d');
  if(annualChart) annualChart.destroy();

  const annualData = {
    '2023': 4783598,
    '2024': 3247423,
  };

  const annualLabels = Object.keys(annualData);
  const annualValues = Object.values(annualData);

  annualLabels.push('2025');
  annualValues.push(totalCosto2025);

  annualChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: annualLabels,
      datasets: [
        {
          label: 'Costo Anual',
          data: annualValues,
          backgroundColor: '#34495e',
          borderRadius: 4
        },
        {
          label: 'Budget 2025',
          data: [null, null, totalBudget2025],
          type: 'line',
          borderColor: '#e74c3c',
          borderWidth: 2,
          fill: false,
          pointRadius: 5,
          pointBackgroundColor: '#e74c3c',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Costo Anual USD',
            font: { size: 14, weight: 'bold' }
          },
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              }).format(value);
            }
          },
          max: 5000000
        }
      }
    }
  });
}
