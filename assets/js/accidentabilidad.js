// 🔽 Mapa de links por hoja
const CSV_LINKS = {
  "Diario": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxhauVDN2f_H2o7ng_Lm0d3Kaa68hoGpmhmAYK4RjZzzn--ob5nISC2VYVuRhyWw/pub?gid=558860578&single=true&output=csv",
  "Resumen Mensual": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxhauVDN2f_H2o7ng_Lm0d3Kaa68hoGpmhmAYK4RjZzzn--ob5nISC2VYVuRhyWw/pub?gid=1481654901&single=true&output=csv"
};

const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

let selectedDayType = null;
let calendarData = []; // Datos diarios
let resumenData = [];  // Datos de resumen mensual
let selectedMonth = monthNames[new Date().getMonth()];

const calendarDaysContainer = document.getElementById('calendar-days');
const monthlySummaryBody = document.getElementById('monthly-summary-body');
const monthSelect = document.getElementById('month-select');

// ---------------- Funciones de render ----------------
function getCurrentCalendarData(mes) {
  return calendarData.filter(d => d.mes === mes);
}

function createCrossCalendar(currentMonth) {
  calendarDaysContainer.innerHTML = '';
  const crossRows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
    [28, 29, 30],
    [null, 31, null]
  ];

  const calendarDataForMonth = getCurrentCalendarData(currentMonth);

  crossRows.forEach(rowDays => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'calendar-row d-flex justify-content-center mb-1';

    rowDays.forEach(dayNum => {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day d-flex align-items-center justify-content-center rounded border mx-1';
      dayElement.style.width = '40px';
      dayElement.style.height = '40px';
      dayElement.style.cursor = 'pointer';
      dayElement.style.userSelect = 'none';

      if(dayNum && dayNum <= 31){
        dayElement.textContent = dayNum;
        dayElement.dataset.day = dayNum;

        const dayInfo = calendarDataForMonth.find(d => d.dia == dayNum);
        if(dayInfo) dayElement.classList.add(dayInfo.tipo);

        dayElement.addEventListener('click', () => {
          // Mostrar imágenes si es accidente
          /*if(dayInfo && dayInfo.tipo === 'accident'){
            const container = document.getElementById('accidentImages');
            container.innerHTML = '';
            for(let i=1;i<=3;i++){
              const img = document.createElement('img');
              img.src = `../assets/Archivos/Empleado/Accidentes/${currentMonth}_${dayNum}_${i}.PNG`;
              img.style.maxWidth = "550px";
              img.style.borderRadius = "8px";
              img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
              img.onerror = () => img.remove();
              container.appendChild(img);
            }
            new bootstrap.Modal(document.getElementById('accidentModal')).show();
          } 
          // Si seleccionamos tipo de día con botones* AGREGAR ELSEIF*/
          if(selectedDayType){
            dayElement.className = 'calendar-day d-flex align-items-center justify-content-center rounded border mx-1';
            dayElement.style.width = '40px';
            dayElement.style.height = '40px';
            dayElement.classList.add(selectedDayType);
            updateCalendarData(dayNum, currentMonth, selectedDayType, 'Área Genérica', 'Completado', 'Alta');
            renderMonthlySummary();
          }
        });
      } else {
        dayElement.textContent = '';
        dayElement.style.visibility = 'hidden';
        dayElement.style.width = '40px';
        dayElement.style.height = '40px';
        dayElement.style.margin = '0 4px';
      }

      rowDiv.appendChild(dayElement);
    });

    calendarDaysContainer.appendChild(rowDiv);
  });
}

function updateCalendarData(dia, mes, tipo, area='', estatus='', calificacion=''){
  const index = calendarData.findIndex(d => d.dia == dia && d.mes == mes);
  if(index >= 0) calendarData[index] = {dia, mes, tipo, area, estatus, calificacion};
  else calendarData.push({dia, mes, tipo, area, estatus, calificacion});
}

function generateMonthlySummary() {
  const summary = {};
  calendarData.forEach(({dia, mes, tipo, area, estatus, calificacion}) => {
    if(!summary[mes]) summary[mes] = {cantidad:0, areas:new Set(), estatuses:new Set(), calificaciones:new Set()};
    if(tipo==='accident') summary[mes].cantidad++;
    if(area) summary[mes].areas.add(area);
    if(estatus) summary[mes].estatuses.add(estatus);
    if(calificacion) summary[mes].calificaciones.add(calificacion);
  });
  Object.keys(summary).forEach(mes => {
    summary[mes].areas = Array.from(summary[mes].areas).join(', ');
    summary[mes].estatuses = Array.from(summary[mes].estatuses).join(', ');
    summary[mes].calificaciones = Array.from(summary[mes].calificaciones).join(', ');
  });
  return summary;
}

function renderMonthlySummary() {
  const summary = generateMonthlySummary();
  monthlySummaryBody.innerHTML = '';
  monthNames.forEach(mes=>{
    const data = summary[mes] || {cantidad:0, areas:'', estatuses:'', calificaciones:''};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${mes}</td><td>${data.cantidad}</td><td>${data.areas}</td><td>${data.estatuses}</td><td>${data.calificaciones}</td>`;
    monthlySummaryBody.appendChild(tr);
  });
}

function renderResumenDesdeCSV(resumenData){
  monthlySummaryBody.innerHTML = '';
  monthNames.forEach(mes=>{
    const fila = resumenData.find(r => r.Mes===mes) || {Cantidad_Total:0, Áreas:'', Estatus_General:'', Calificación_General:''};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${mes}</td><td>${fila.Cantidad_Total || fila.cantidad || 0}</td>
                    <td>${fila.Áreas || fila.areas || ''}</td>
                    <td>${fila.Estatus_General || fila.estatus_general || ''}</td>
                    <td>${fila.Calificación_General || fila.calificacion_general || ''}</td>`;
    monthlySummaryBody.appendChild(tr);
  });
}

// ---------------- Lectura CSV ----------------
async function loadCSVFromUrl(url) {
  const response = await fetch(url);
  if(!response.ok) throw new Error("No se pudo cargar el archivo");
  const csvText = await response.text();
  return csvText
        .trim()
        .split('\n')
        .map(row=>row.split(','))
        .map((row,i)=>{
          if(i===0) return null; // Encabezado
          return row;
        }).filter(r=>r!==null);
}

async function loadAllCSVData() {
  try{
    // Cargar Diario
    const diarioCSV = await loadCSVFromUrl(CSV_LINKS["Diario"]);
    calendarData = diarioCSV.map(r=>({
      dia: parseInt(r[0]),
      mes: r[1],
      tipo: r[2],
      area: r[3] || '',
      estatus: r[4] || '',
      calificacion: r[5] || ''
    }));

    // Cargar Resumen Mensual
    const resumenCSV = await loadCSVFromUrl(CSV_LINKS["Resumen Mensual"]);
    resumenData = resumenCSV.map(r=>({
      Mes: r[0],
      Cantidad_Total: r[1],
      Áreas: r[2],
      Estatus_General: r[3],
      Calificación_General: r[4]
    }));

    // Render inicial
    renderForSelectedMonth();
  } catch(err){
    console.error(err);
    alert("Error cargando CSV: " + err.message);
  }
}

function renderForSelectedMonth(){
  createCrossCalendar(selectedMonth);
  if(resumenData.length>0) renderResumenDesdeCSV(resumenData);
  else renderMonthlySummary();
}

// ---------------- Botones y select ----------------
document.querySelectorAll('.day-control').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    selectedDayType = btn.dataset.type;
    document.querySelectorAll('.day-control').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

if(monthSelect){
  monthSelect.value = selectedMonth;
  monthSelect.addEventListener('change', function(){
    selectedMonth = this.value;
    renderForSelectedMonth();
  });
}

// ---------------- Exportar ----------------
function exportToExcel(){
  const diarioData = calendarData.map(d=>({Día:d.dia, Mes:d.mes, Tipo:d.tipo, AREA:d.area, ESTATUS:d.estatus, CALIFICACION:d.calificacion}));
  const resumenXls = Object.keys(generateMonthlySummary()).map(mes=>{
    const r = generateMonthlySummary()[mes];
    return {Mes:mes, Cantidad_Total:r.cantidad, Áreas:r.areas, Estatus_General:r.estatuses, Calificación_General:r.calificaciones};
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(diarioData),'Diario');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(resumenXls),'Resumen Mensual');
  XLSX.writeFile(wb,'accidentabilidad.xlsx');
}

document.getElementById('saveChangesBtn').addEventListener('click', exportToExcel);

// ---------------- Inicialización ----------------
document.addEventListener('DOMContentLoaded', loadAllCSVData);
