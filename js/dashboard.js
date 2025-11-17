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
    : `http://localhost:8080/api/empleado/movimientos/rango?inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`;
}

export function initDashboard() {
  console.log('🔄 Inicializando dashboard...');

  const btnFiltrar = document.getElementById("dashboard-btn-filtrar");
  if (btnFiltrar) {
    btnFiltrar.addEventListener("click", filtrarPorFechas);
  }

  const btnLimpiar = document.getElementById("dashboard-btn-limpiar");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      document.getElementById("dashboard-fecha-inicio").value = "";
      document.getElementById("dashboard-fecha-fin").value = "";
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
  const tbody = document.getElementById("dashboard-tbody-movimientos");
  if (!tbody) return console.error("❌ No se encontró dashboard-tbody-movimientos");

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
      tr.classList.add("dashboard-movimiento-row");

      tr.innerHTML = `
        <td>${mov.id}</td>
        <td>${new Date(mov.fecha).toLocaleString()}</td>
        <td>${mov.tipoMovimiento}</td>
        <td>${mov.usuarioNombre ?? mov.usuario ?? "-"}</td>
        <td>${mov.comentario || '-'}</td>
        <td>${mov.bodegaOrigenNombre || mov.bodegaOrigen || '-'}</td>
        <td>${mov.bodegaDestinoNombre || mov.bodegaDestino || '-'}</td>
        <td>
          <button class="dashboard-btn-detalles" data-movimiento-id="${mov.id}">🔍 Ver detalles</button>
          <button class="dashboard-btn-editar" data-movimiento-id="${mov.id}">✏️ Editar</button>
          ${isAdmin ? `<button class="dashboard-btn-eliminar" data-movimiento-id="${mov.id}">🗑️ Eliminar</button>` : ""}
        </td>
      `;

      // Crear fila de detalles con la información que ya tenemos
      const detallesRow = document.createElement("tr");
      detallesRow.classList.add("dashboard-detalles-row");
      detallesRow.style.display = "none";
      
      // Generar el HTML de detalles directamente con los datos del movimiento
      detallesRow.innerHTML = `
        <td colspan="8">
          <div class="dashboard-detalles-content">
            <h4>Detalles del Movimiento #${mov.id}</h4>
            ${generarHTMLDetalles(mov.detalles)}
          </div>
        </td>
      `;

      // Event listener para el botón de detalles
      const btnDetalles = tr.querySelector(".dashboard-btn-detalles");
      btnDetalles.addEventListener("click", () => {
        // Simplemente alternar la visibilidad - los detalles ya están cargados
        detallesRow.style.display = detallesRow.style.display === "none" ? "table-row" : "none";
      });

      // Event listeners para editar y eliminar
      const btnEditar = tr.querySelector(".dashboard-btn-editar");
      btnEditar.addEventListener("click", () => editarMovimiento(mov.id));

      if (isAdmin) {
        const btnEliminar = tr.querySelector(".dashboard-btn-eliminar");
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

// Función auxiliar para generar el HTML de los detalles
function generarHTMLDetalles(detalles) {
  if (!detalles || detalles.length === 0) {
    return '<div class="detalles-vacio">No hay productos en este movimiento</div>';
  }

  let html = `
    <div class="detalles-lista">
      <table class="detalles-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
  `;

  detalles.forEach(detalle => {
    html += `
      <tr>
        <td>${detalle.productoNombre || 'N/A'}</td>
        <td>${detalle.cantidad || 0}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <div class="detalles-resumen">
        <strong>Total de productos: ${detalles.length}</strong>
        <strong>Total de unidades: ${detalles.reduce((sum, det) => sum + (det.cantidad || 0), 0)}</strong>
      </div>
    </div>
  `;

  return html;
}

async function filtrarPorFechas() {
  console.log("Entre")
  const inicioInput = document.getElementById("dashboard-fecha-inicio").value;
  const finInput = document.getElementById("dashboard-fecha-fin").value;

  if (!inicioInput || !finInput) return alert("Selecciona ambas fechas.");

  const inicioISO = new Date(`${inicioInput}T00:00:00`).toISOString();
  const finISO = new Date(`${finInput}T23:59:59`).toISOString();

  const url = getRangoUrl(inicioISO, finISO);
  await cargarMovimientos(url);
}

async function editarMovimiento(id) {
  const tbody = document.getElementById("dashboard-tbody-movimientos");
  const row = tbody.querySelector(`.dashboard-btn-editar[data-movimiento-id="${id}"]`).closest("tr");

  const mov = {
    id,
    fecha: row.children[1].textContent,
    tipoMovimiento: row.children[2].textContent,
    usuarioNombre: row.children[3].textContent,
    comentario: row.children[4].textContent,
    bodegaOrigenNombre: row.children[5].textContent,
    bodegaDestinoNombre: row.children[6].textContent
  };

  function convertirFechaTablaAFechaInput(fechaTabla) {
    try {
      const fecha = new Date(fechaTabla);
      return fecha.toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  }

  const fechaParaInput = convertirFechaTablaAFechaInput(mov.fecha);

  try {
    const token = userData?.token;
    const isAdmin = userData?.rol === "ADMIN";

    const bodegasUrl = isAdmin 
      ? "http://localhost:8080/api/admin/bodegas"
      : `http://localhost:8080/api/empleado/bodegas?usuarioId=${userData.id}`;

    const productosUrl = isAdmin
      ? "http://localhost:8080/api/admin/productos"
      : `http://localhost:8080/api/empleado/productos?usuarioId=${userData.id}`;

    const updateUrl = isAdmin
      ? `http://localhost:8080/api/admin/movimientos/${id}`
      : `http://localhost:8080/api/empleado/movimientos/${id}?usuarioId=${userData.id}`;

    const [bodegasResp, productosResp] = await Promise.all([
      fetch(bodegasUrl, { headers: { "Authorization": `Bearer ${token}` }}),
      fetch(productosUrl, { headers: { "Authorization": `Bearer ${token}` }})
    ]);

    const bodegasText = await bodegasResp.text();
    const productosText = await productosResp.text();

    const bodegas = bodegasText ? JSON.parse(bodegasText) : [];
    const productos = productosText ? JSON.parse(productosText) : [];

    let modal = document.getElementById("dashboard-modal-editar");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "dashboard-modal-editar";
      modal.className = "dashboard-modal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="dashboard-modal-content">
        <span id="dashboard-cerrar-modal" class="dashboard-close">&times;</span>
        <h3>Editar Movimiento #${id}</h3>

        <form id="dashboard-form-editar">
          <div class="form-group">
            <label for="dashboard-editar-tipo-mov">Tipo de Movimiento:</label>
            <select id="dashboard-editar-tipo-mov">
              <option value="ENTRADA" ${mov.tipoMovimiento === "ENTRADA" ? "selected":""}>ENTRADA</option>
              <option value="SALIDA" ${mov.tipoMovimiento === "SALIDA" ? "selected":""}>SALIDA</option>
              <option value="TRASLADO" ${mov.tipoMovimiento === "TRASLADO" ? "selected":""}>TRASLADO</option>
            </select>
          </div>

          <div class="form-group">
            <label for="dashboard-editar-comentario">Comentario:</label>
            <textarea id="dashboard-editar-comentario">${mov.comentario||""}</textarea>
          </div>

          <div class="form-group">
            <label for="dashboard-editar-bodega-origen">Bodega Origen:</label>
            <select id="dashboard-editar-bodega-origen">
              <option value="">-- Seleccione --</option>
              ${bodegas.map(b => `<option value="${b.id}" ${b.nombre === mov.bodegaOrigenNombre ? "selected":""}>${b.nombre}</option>`).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="dashboard-editar-bodega-destino">Bodega Destino:</label>
            <select id="dashboard-editar-bodega-destino">
              <option value="">-- Seleccione --</option>
              ${bodegas.map(b => `<option value="${b.id}" ${b.nombre === mov.bodegaDestinoNombre ? "selected":""}>${b.nombre}</option>`).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="dashboard-editar-fecha">Fecha:</label>
            <input type="datetime-local" id="dashboard-editar-fecha" value="${fechaParaInput}" />
          </div>

          <div class="form-group">
            <label>Detalles del Movimiento:</label>
            <div id="dashboard-detalles-container">
              <div class="detalle-item">
                <select class="detalle-producto" required>
                  <option value="">-- Seleccione Producto --</option>
                  ${productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("")}
                </select>
                <input class="detalle-cantidad" type="number" min="1" value="1" required />
                <button type="button" class="btn-eliminar-detalle">🗑️</button>
              </div>
            </div>
            <button type="button" id="btn-agregar-detalle" class="btn-secondary">➕ Agregar Producto</button>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Guardar</button>
            <button type="button" id="btn-cancelar-edicion" class="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove("hidden");

    document.getElementById("dashboard-cerrar-modal").onclick = () => modal.classList.add("hidden");
    document.getElementById("btn-cancelar-edicion").onclick = () => modal.classList.add("hidden");

    document.getElementById("btn-agregar-detalle").addEventListener("click", () => {
      const container = document.getElementById("dashboard-detalles-container");
      const detalleDiv = document.createElement("div");
      detalleDiv.className = "detalle-item";
      detalleDiv.innerHTML = `
        <select class="detalle-producto" required>
          <option value="">-- Seleccione Producto --</option>
          ${productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("")}
        </select>
        <input class="detalle-cantidad" type="number" min="1" value="1" required />
        <button type="button" class="btn-eliminar-detalle">🗑️</button>
      `;
      container.appendChild(detalleDiv);
    });

    document.getElementById("dashboard-detalles-container").addEventListener("click", function(e) {
      if (e.target.classList.contains('btn-eliminar-detalle')) {
        const detalleItem = e.target.closest('.detalle-item');
        if (document.querySelectorAll('.detalle-item').length > 1) {
          detalleItem.remove();
        } else {
          alert("Debe haber al menos un producto en el movimiento");
        }
      }
    });

    document.getElementById("dashboard-form-editar").onsubmit = async e => {
      e.preventDefault();

      const tipoMovimiento = document.getElementById("dashboard-editar-tipo-mov").value;
      const comentario = document.getElementById("dashboard-editar-comentario").value;
      const bodegaOrigenId = parseInt(document.getElementById("dashboard-editar-bodega-origen").value || 0);
      const bodegaDestinoId = parseInt(document.getElementById("dashboard-editar-bodega-destino").value || 0);
      const fechaInput = document.getElementById("dashboard-editar-fecha").value;

      if (!fechaInput) {
        alert("La fecha es requerida");
        return;
      }

      const fechaISO = new Date(fechaInput).toISOString();

      const detalles = [];
      const detalleItems = document.querySelectorAll('.detalle-item');
      
      for (const item of detalleItems) {
        const productoId = item.querySelector('.detalle-producto').value;
        const cantidad = parseInt(item.querySelector('.detalle-cantidad').value) || 0;
        
        if (!productoId) {
          alert("Todos los productos deben estar seleccionados");
          return;
        }
        
        if (cantidad <= 0) {
          alert("Todas las cantidades deben ser mayores a 0");
          return;
        }
        
        detalles.push({
          productoId: parseInt(productoId),
          cantidad: cantidad
        });
      }

      if (detalles.length === 0) {
        alert("Debe agregar al menos un producto");
        return;
      }

      if (tipoMovimiento === "TRASLADO" && (!bodegaOrigenId || !bodegaDestinoId)) {
        alert("Para traslados, debe especificar tanto bodega origen como destino");
        return;
      }

      const payload = {
        tipoMovimiento: tipoMovimiento,
        comentario: comentario,
        bodegaOrigenId: bodegaOrigenId,
        bodegaDestinoId: bodegaDestinoId,
        fecha: fechaISO,
        detalles: detalles
      };

      try {
        const resp = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt);
        }

        alert("Movimiento actualizado");
        modal.classList.add("hidden");
        cargarMovimientos();
      } catch (error) {
        console.error("❌ Error al editar movimiento:", error);
        alert("Error al actualizar el movimiento: " + error.message);
      }
    };

  } catch (err) {
    console.error("❌ Error al cargar datos para editar:", err);
    alert("Error cargando movimiento");
  }
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
    alert("Hubo un problema al eliminar movimiento. Revisa la consola.");
  }
}
