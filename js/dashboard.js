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
  if (btnFiltrar) btnFiltrar.replaceWith(btnFiltrar.cloneNode(true));
  const newBtnFiltrar = document.getElementById("btn-filtrar");
  if (newBtnFiltrar) newBtnFiltrar.addEventListener("click", filtrarPorFechas);

  const btnLimpiar = document.getElementById("btn-limpiar");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      document.getElementById("fecha-inicio").value = "";
      document.getElementById("fecha-fin").value = "";
      cargarMovimientos(); 
    });
  }

  cargarResumen();
  cargarMovimientos();
}


async function cargarResumen() {
  try {
    console.log('📊 Cargando resumen...');
    const response = await fetch(resumenUrl, {
      headers: { "Authorization": `Bearer ${userData?.token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();

    document.getElementById("total-bodegas").textContent = data.totalBodegas;
    document.getElementById("total-productos").textContent = data.totalProductos;
    document.getElementById("movimientos-hoy").textContent = data.movimientosHoy;
    
  } catch (error) {
    console.error("❌ Error al cargar el resumen:", error);
  }
}

async function cargarMovimientos(url = movimientosBaseUrl) {
  const tbody = document.getElementById("tbody-movimientos");
  if (!tbody) return console.error("❌ No se encontró tbody-movimientos");

  tbody.innerHTML = "<tr><td colspan='8'>Cargando...</td></tr>";

  try {
    console.log('📋 Cargando movimientos...');
    const response = await fetch(url, { headers: { "Authorization": `Bearer ${userData?.token}` }});
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
          ${isAdmin ? `<button class="btn-eliminar" data-movimiento-id="${mov.id}">🗑️ Eliminar</button>` : ""}
        </td>
      `;

      const detallesRow = document.createElement("tr");
      detallesRow.classList.add("detalles-row");
      detallesRow.style.display = "none";

      const detallesHTML = mov.detalles?.length
        ? `<ul class="detalle-lista">${mov.detalles.map(d => `<li>${d.productoNombre} — <strong>${d.cantidad}</strong></li>`).join('')}</ul>`
        : `<em>Sin detalles registrados.</em>`;

      detallesRow.innerHTML = `
        <td colspan="8">
          <div class="detalles-contenido">
            <h4>Detalles del movimiento #${mov.id}</h4>
            ${detallesHTML}
            ${isAdmin ? `<button class="btn-eliminar" data-movimiento-id="${mov.id}">🗑️ Eliminar</button>` : ''}
          </div>
        </td>`;

      tr.querySelector(".btn-detalles").addEventListener("click", () => {
        detallesRow.style.display = detallesRow.style.display === "none" ? "table-row" : "none";
      });

      if (isAdmin) {
        const btnEditar = tr.querySelector(".btn-editar");
        btnEditar.addEventListener("click", () => editarMovimiento(mov.id));

        const btnEliminar = tr.querySelector(".btn-eliminar");
        btnEliminar.addEventListener("click", () => eliminarMovimiento(mov.id));
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

  if (!inicioInput || !finInput) return alert("Selecciona ambas fechas.");

  const inicioISO = new Date(`${inicioInput}T00:00:00`).toISOString();
  const finISO = new Date(`${finInput}T23:59:59`).toISOString();

  const url = getRangoUrl(inicioISO, finISO);
  await cargarMovimientos(url);
}

function editarMovimiento(id) {
  const tbody = document.getElementById("tbody-movimientos");
  const row = tbody.querySelector(`.btn-editar[data-movimiento-id="${id}"]`).closest("tr");
  
  const mov = {
    id,
    fecha: row.children[1].textContent,
    tipoMovimiento: row.children[2].textContent,
    comentario: row.children[4].textContent,
  };

  let modal = document.getElementById("modal-editar-movimiento");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-editar-movimiento";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <span id="cerrar-modal-mov" class="close">&times;</span>
        <h3>Editar Movimiento #${id}</h3>
        <form id="form-editar-mov">
          <label>Comentario:</label>
          <input type="text" id="editar-comentario" value="${mov.comentario || ''}" />
          <label>Tipo de Movimiento:</label>
          <select id="editar-tipo-mov">
            <option value="ENTRADA" ${mov.tipoMovimiento === 'ENTRADA' ? 'selected' : ''}>ENTRADA</option>
            <option value="SALIDA" ${mov.tipoMovimiento === 'SALIDA' ? 'selected' : ''}>SALIDA</option>
          </select>
          <button type="submit">Guardar cambios</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("cerrar-modal-mov").onclick = () => modal.classList.add("hidden");
  } else {
    modal.querySelector("#editar-comentario").value = mov.comentario || '';
    modal.querySelector("#editar-tipo-mov").value = mov.tipoMovimiento;
  }

  modal.classList.remove("hidden");

  const form = document.getElementById("form-editar-mov");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const comentario = document.getElementById("editar-comentario").value;
    const tipoMovimiento = document.getElementById("editar-tipo-mov").value;

    try {
      const token = userData?.token;
      if (!token) throw new Error("Usuario no autenticado");

      const url = `http://localhost:8080/api/admin/movimientos/${id}`;
      const payload = { comentario, tipoMovimiento };

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }

      alert(`✅ Movimiento #${id} actualizado`);
      modal.classList.add("hidden");
      cargarMovimientos();

    } catch (error) {
      console.error("❌ Error al editar movimiento:", error);
      alert("Hubo un problema al actualizar el movimiento. Revisa la consola.");
    }
  };
}

function eliminarMovimiento(id) {
  if (!confirm(`⚠️ ¿Estás seguro de eliminar el movimiento #${id}? Esta acción no se puede deshacer.`)) return;

  try {
    const token = userData?.token;
    if (!token) throw new Error("Usuario no autenticado");

    const url = `http://localhost:8080/api/admin/movimientos/${id}`;

    fetch(url, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } })
      .then(response => {
        if (!response.ok) return response.text().then(text => { throw new Error(text); });
        alert(`✅ Movimiento #${id} eliminado correctamente`);
        cargarMovimientos();
      })
      .catch(error => {
        console.error("❌ Error al eliminar movimiento:", error);
        alert("Hubo un problema al eliminar el movimiento. Revisa la consola.");
      });

  } catch (error) {
    console.error("❌ Error al eliminar movimiento:", error);
    alert("Hubo un problema al eliminar el movimiento. Revisa la consola.");
  }
}
