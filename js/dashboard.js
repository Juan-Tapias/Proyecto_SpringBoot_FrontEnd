const userData = JSON.parse(sessionStorage.getItem("userData"));
const isAdmin = userData?.rol === "ADMIN";

const movimientosBaseUrl = isAdmin
  ? "http://localhost:8080/api/admin/movimientos"
  : `http://localhost:8080/api/empleado/movimientos?usuarioId=${userData?.id}`;

const resumenUrl = isAdmin
  ? "http://localhost:8080/api/admin/movimientos/resumen"
  : `http://localhost:8080/api/empleado/movimientos/resumen?usuarioId=${userData?.id}`;

function getRangoUrl(inicioISO, finISO) {
  return isAdmin
    ? `http://localhost:8080/api/admin/movimientos/rango?inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`
    : `http://localhost:8080/api/empleado/movimientos/rango?usuarioId=${userData.id}&inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`;
}

export function initDashboard() {
  console.log('🔄 Inicializando dashboard...');
  
  const btnFiltrar = document.getElementById("btn-filtrar");
  if (btnFiltrar) {
    btnFiltrar.replaceWith(btnFiltrar.cloneNode(true));
  }

  const newBtnFiltrar = document.getElementById("btn-filtrar");
  if (newBtnFiltrar) {
    newBtnFiltrar.addEventListener("click", filtrarPorFechas);
  }

  cargarResumen();
  cargarMovimientos();
}

async function cargarResumen() {
  try {
    console.log('📊 Cargando resumen...');
    const response = await fetch(resumenUrl, {
      headers: {
        "Authorization": `Bearer ${userData?.token}`
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();

    const totalBodegasElem = document.getElementById("total-bodegas");
    const totalProductosElem = document.getElementById("total-productos");
    const movimientosHoyElem = document.getElementById("movimientos-hoy");

    if (totalBodegasElem) totalBodegasElem.textContent = data.totalBodegas;
    if (totalProductosElem) totalProductosElem.textContent = data.totalProductos;
    if (movimientosHoyElem) movimientosHoyElem.textContent = data.movimientosHoy;
    
  } catch (error) {
    console.error("❌ Error al cargar el resumen:", error);
  }
}

async function cargarMovimientos(url = movimientosBaseUrl) {
  const tbody = document.getElementById("tbody-movimientos");
  if (!tbody) {
    console.error("❌ No se encontró tbody-movimientos");
    return;
  }

  tbody.innerHTML = "<tr><td colspan='8'>Cargando...</td></tr>";

  try {
    console.log('📋 Cargando movimientos...');
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${userData?.token}`
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const movimientos = await response.json();

    tbody.innerHTML = "";

    if (!movimientos.length) {
      tbody.innerHTML = "<tr><td colspan='8'>No hay movimientos registrados.</td></tr>";
      return;
    }

    movimientos.forEach(mov => {
      const tr = document.createElement("tr");
      tr.classList.add("movimiento-row");

      tr.innerHTML = `
        <td>${mov.id}</td>
        <td>${new Date(mov.fecha).toLocaleString()}</td>
        <td>${mov.tipoMovimiento}</td>
        <td>${mov.usuarioNombre ?? mov.usuario ?? "-"}</td>
        <td>${mov.comentario || '-'}</td>
        <td>${mov.bodegaOrigenNombre || mov.bodegaOrigen || '-'}</td>
        <td>${mov.bodegaDestinoNombre || mov.bodegaDestino || '-'}</td>
        <td>
          <button class="btn-detalles">🔍 Ver detalles</button>
          ${isAdmin ? `<button class="btn-editar" data-movimiento-id="${mov.id}">✏️ Editar</button>` : ""}
        </td>
      `;

      const detallesRow = document.createElement("tr");
      detallesRow.classList.add("detalles-row");
      detallesRow.style.display = "none";

      const detallesHTML = mov.detalles?.length
        ? `<ul class="detalle-lista">${mov.detalles.map(d => `<li>${d.productoNombre} — <strong>${d.cantidad}</strong></li>`).join('')}</ul>`
        : `<em>Sin detalles registrados.</em>`;

      detallesRow.innerHTML = `<td colspan="8"><div class="detalles-contenido"><h4>Detalles del movimiento #${mov.id}</h4>${detallesHTML}</div></td>`;

      tr.querySelector(".btn-detalles").addEventListener("click", () => {
        detallesRow.style.display = detallesRow.style.display === "none" ? "table-row" : "none";
      });

      if (isAdmin) {
        const btnEditar = tr.querySelector(".btn-editar");
        btnEditar.addEventListener("click", () => editarMovimiento(mov.id));
      }

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
    alert("Selecciona ambas fechas.");
    return;
  }

  const inicioISO = new Date(`${inicioInput}T00:00:00`).toISOString();
  const finISO = new Date(`${finInput}T23:59:59`).toISOString();

  const url = getRangoUrl(inicioISO, finISO);
  await cargarMovimientos(url);
}

function editarMovimiento(id) {
  console.log(`✏️ Editando movimiento ${id}`);
}