import { renderSidebarMenu } from '../components/menu.js';
renderSidebarMenu('.targetSelector');

document.addEventListener('DOMContentLoaded', async () => {
  await cargarResumen();
  await cargarMovimientos(); 

  const btnFiltrar = document.getElementById("btn-filtrar");
  if (btnFiltrar) btnFiltrar.addEventListener("click", filtrarPorFechas);
});

async function cargarResumen() {
  try {
    const response = await fetch("http://localhost:8080/api/movimientos/resumen");
    const data = await response.json();

    document.getElementById("total-bodegas").textContent = data.totalBodegas;
    document.getElementById("total-productos").textContent = data.totalProductos;
    document.getElementById("movimientos-hoy").textContent = data.movimientosHoy;

  } catch (error) {
    console.error("❌ Error al cargar el resumen:", error);
  }
}

async function cargarMovimientos(url = "http://localhost:8080/api/movimientos") {
  const tbody = document.getElementById("tbody-movimientos");
  tbody.innerHTML = "<tr><td colspan='8'>Cargando...</td></tr>";

  try {
    const response = await fetch(url);
    const movimientos = await response.json();

    tbody.innerHTML = "";

    if (!movimientos.length) {
      tbody.innerHTML = "<tr><td colspan='8'>No hay movimientos registrados en este rango.</td></tr>";
      return;
    }

    movimientos.forEach(mov => {
      const tr = document.createElement("tr");
      tr.classList.add("movimiento-row");

      tr.innerHTML = `
        <td>${mov.id}</td>
        <td>${new Date(mov.fecha).toLocaleString()}</td>
        <td>${mov.tipoMovimiento}</td>
        <td>${mov.usuarioNombre}</td>
        <td>${mov.comentario || '-'}</td>
        <td>${mov.bodegaOrigenNombre || '-'}</td>
        <td>${mov.bodegaDestinoNombre || '-'}</td>
        <td>
          <button class="btn-detalles">🔍 Ver detalles</button>
          <button class="btn-editar" onclick="editarMovimiento(${mov.id})">✏️ Editar</button>
        </td>
      `;

      const detallesRow = document.createElement("tr");
      detallesRow.classList.add("detalles-row");
      detallesRow.style.display = "none"; 

      const detallesHTML = mov.detalles?.length
        ? `
          <ul class="detalle-lista">
            ${mov.detalles.map(d => `
              <li>${d.productoNombre} — <strong>${d.cantidad}</strong></li>
            `).join('')}
          </ul>
        `
        : `<em>Sin detalles registrados.</em>`;

      detallesRow.innerHTML = `
        <td colspan="8">
          <div class="detalles-contenido">
            <h4>Detalles del movimiento #${mov.id}</h4>
            ${detallesHTML}
          </div>
        </td>
      `;

      tr.querySelector(".btn-detalles").addEventListener("click", () => {
        detallesRow.style.display =
          detallesRow.style.display === "none" ? "table-row" : "none";
      });

      tbody.appendChild(tr);
      tbody.appendChild(detallesRow);
    });

  } catch (error) {
    console.error("❌ Error al cargar movimientos:", error);
    tbody.innerHTML = "<tr><td colspan='8' style='color:red;'>Error al cargar datos.</td></tr>";
  }
}

async function filtrarPorFechas() {
  const inicioInput = document.getElementById("fecha-inicio").value;
  const finInput = document.getElementById("fecha-fin").value;

  if (!inicioInput || !finInput) {
    alert("⚠️ Por favor selecciona ambas fechas antes de filtrar.");
    return;
  }

  const inicio = new Date(`${inicioInput}T00:00:00`);
  const fin = new Date(`${finInput}T23:59:59`);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    alert("⚠️ Las fechas seleccionadas no son válidas.");
    return;
  }

  const inicioISO = inicio.toISOString();
  const finISO = fin.toISOString();

  const url = `http://localhost:8080/api/movimientos/rango?inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`;

  console.log("📅 Filtrando desde:", inicioISO, "hasta:", finISO);

  await cargarMovimientos(url);
}

window.editarMovimiento = function(id) {
  alert("Editar movimiento ID: " + id);
};
