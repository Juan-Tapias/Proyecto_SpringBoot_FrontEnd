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
  
  const btnFiltrar = document.getElementById("dashboard-btn-filtrar");
  if (btnFiltrar) btnFiltrar.replaceWith(btnFiltrar.cloneNode(true));
  const newBtnFiltrar = document.getElementById("dashboard-btn-filtrar");
  if (newBtnFiltrar) newBtnFiltrar.addEventListener("click", filtrarPorFechas);

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
          <button class="dashboard-btn-detalles">🔍 Ver detalles</button>
          ${isAdmin ? `<button class="dashboard-btn-editar" data-movimiento-id="${mov.id}">✏️ Editar</button>` : ""}
          ${isAdmin ? `<button class="dashboard-btn-eliminar" data-movimiento-id="${mov.id}">🗑️ Eliminar</button>` : ""}
        </td>
      `;

      const detallesRow = document.createElement("tr");
      detallesRow.classList.add("dashboard-detalles-row");
      detallesRow.style.display = "none";

      const detallesHTML = mov.detalles?.length
        ? `<ul class="dashboard-detalle-lista">${mov.detalles.map(d => `<li>${d.productoNombre} — <strong>${d.cantidad}</strong></li>`).join('')}</ul>`
        : `<em>Sin detalles registrados.</em>`;

      detallesRow.innerHTML = `
        <td colspan="8">
          <div class="dashboard-detalles-contenido">
            <h4>Detalles del movimiento #${mov.id}</h4>
            ${detallesHTML}
            ${isAdmin ? `<button class="dashboard-btn-eliminar" data-movimiento-id="${mov.id}">🗑️ Eliminar</button>` : ''}
          </div>
        </td>`;

      tr.querySelector(".dashboard-btn-detalles").addEventListener("click", () => {
        detallesRow.style.display = detallesRow.style.display === "none" ? "table-row" : "none";
      });

      if (isAdmin) {
        const btnEditar = tr.querySelector(".dashboard-btn-editar");
        btnEditar.addEventListener("click", () => editarMovimiento(mov.id));

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

async function filtrarPorFechas() {
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
    bodegaDestinoNombre: row.children[6].textContent,
  };

  function convertirFechaTablaAFechaInput(fechaTabla) {
    try {
      const [fechaParte, horaParte, periodo] = fechaTabla.split(/[, ]+/);
      const [dia, mes, anio] = fechaParte.split('/');
      let [hora, minuto, segundo] = horaParte.split(':');
      
      if (periodo?.toLowerCase().includes('p. m.') || periodo?.toLowerCase().includes('pm')) {
        hora = parseInt(hora) + 12;
        if (hora === 24) hora = 12;
      } else if (periodo?.toLowerCase().includes('a. m.') || periodo?.toLowerCase().includes('am')) {
        if (hora === '12') hora = '0';
      }
      
      const fechaObj = new Date(
        parseInt(anio),
        parseInt(mes) - 1,
        parseInt(dia),
        parseInt(hora),
        parseInt(minuto),
        parseInt(segundo)
      );
      
      const anioFormateado = fechaObj.getFullYear();
      const mesFormateado = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const diaFormateado = String(fechaObj.getDate()).padStart(2, '0');
      const horaFormateada = String(fechaObj.getHours()).padStart(2, '0');
      const minutoFormateado = String(fechaObj.getMinutes()).padStart(2, '0');
      
      return `${anioFormateado}-${mesFormateado}-${diaFormateado}T${horaFormateada}:${minutoFormateado}`;
    } catch (error) {
      console.error('Error al convertir fecha:', error);
      return new Date().toISOString().slice(0, 16);
    }
  }

  const fechaParaInput = convertirFechaTablaAFechaInput(mov.fecha);

  try {
    const token = userData?.token;
    const [bodegasResponse, productosResponse] = await Promise.all([
      fetch(`http://localhost:8080/api/admin/bodegas?usuarioId=${userData.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      }),
      fetch('http://localhost:8080/api/admin/productos', {
        headers: { "Authorization": `Bearer ${token}` }
      })
    ]);
    const bodegas = await bodegasResponse.json();
    const productos = await productosResponse.json();

    let modal = document.getElementById("dashboard-modal-editar");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "dashboard-modal-editar";
      modal.className = "dashboard-modal";
      modal.innerHTML = `
        <div class="dashboard-modal-content">
          <span id="dashboard-cerrar-modal" class="dashboard-close">&times;</span>
          <h3>Editar Movimiento #${id}</h3>
          <form id="dashboard-form-editar">
            <div class="form-group">
              <label for="dashboard-editar-tipo-mov">Tipo de Movimiento:</label>
              <select id="dashboard-editar-tipo-mov" required>
                <option value="ENTRADA" ${mov.tipoMovimiento === 'ENTRADA' ? 'selected' : ''}>ENTRADA</option>
                <option value="SALIDA" ${mov.tipoMovimiento === 'SALIDA' ? 'selected' : ''}>SALIDA</option>
                <option value="TRASLADO" ${mov.tipoMovimiento === 'TRASLADO' ? 'selected' : ''}>TRASLADO</option>
              </select>
            </div>

            <div class="form-group">
              <label for="dashboard-editar-comentario">Comentario:</label>
              <textarea id="dashboard-editar-comentario" rows="3" placeholder="Descripción del movimiento">${mov.comentario || ''}</textarea>
            </div>

            <div class="form-group">
              <label for="dashboard-editar-bodega-origen">Bodega Origen:</label>
              <select id="dashboard-editar-bodega-origen">
                <option value="">-- Seleccione Bodega Origen --</option>
                ${bodegas.map(bodega => 
                  `<option value="${bodega.id}" ${mov.bodegaOrigenNombre === bodega.nombre ? 'selected' : ''}>
                    ${bodega.nombre}
                  </option>`
                ).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="dashboard-editar-bodega-destino">Bodega Destino:</label>
              <select id="dashboard-editar-bodega-destino">
                <option value="">-- Seleccione Bodega Destino --</option>
                ${bodegas.map(bodega => 
                  `<option value="${bodega.id}" ${mov.bodegaDestinoNombre === bodega.nombre ? 'selected' : ''}>
                    ${bodega.nombre}
                  </option>`
                ).join('')}
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
                    ${productos.map(producto => 
                      `<option value="${producto.id}">${producto.nombre}</option>`
                    ).join('')}
                  </select>
                  <input type="number" class="detalle-cantidad" placeholder="Cantidad" min="1" value="1" required />
                  <button type="button" class="btn-eliminar-detalle">🗑️</button>
                </div>
              </div>
              <button type="button" id="btn-agregar-detalle" class="btn-secondary">➕ Agregar Producto</button>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
              <button type="button" id="btn-cancelar-edicion" class="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
      
      document.getElementById("dashboard-cerrar-modal").onclick = () => modal.classList.add("hidden");
      document.getElementById("btn-cancelar-edicion").onclick = () => modal.classList.add("hidden");
      
      document.getElementById("btn-agregar-detalle").addEventListener("click", agregarDetalle);
      
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
      
    } else {
      modal.querySelector("#dashboard-editar-comentario").value = mov.comentario || '';
      modal.querySelector("#dashboard-editar-tipo-mov").value = mov.tipoMovimiento;
      
      const bodegaOrigenSelect = modal.querySelector("#dashboard-editar-bodega-origen");
      const bodegaDestinoSelect = modal.querySelector("#dashboard-editar-bodega-destino");
      
      bodegaOrigenSelect.innerHTML = `<option value="">-- Seleccione Bodega Origen --</option>` +
        bodegas.map(bodega => 
          `<option value="${bodega.id}" ${mov.bodegaOrigenNombre === bodega.nombre ? 'selected' : ''}>
            ${bodega.nombre}
          </option>`
        ).join('');
      
      bodegaDestinoSelect.innerHTML = `<option value="">-- Seleccione Bodega Destino --</option>` +
        bodegas.map(bodega => 
          `<option value="${bodega.id}" ${mov.bodegaDestinoNombre === bodega.nombre ? 'selected' : ''}>
            ${bodega.nombre}
          </option>`
        ).join('');
      
      modal.querySelector("#dashboard-editar-fecha").value = fechaParaInput;
      
      // Limpiar y resetear detalles
      const detallesContainer = modal.querySelector("#dashboard-detalles-container");
      detallesContainer.innerHTML = `
        <div class="detalle-item">
          <select class="detalle-producto" required>
            <option value="">-- Seleccione Producto --</option>
            ${productos.map(producto => 
              `<option value="${producto.id}">${producto.nombre}</option>`
            ).join('')}
          </select>
          <input type="number" class="detalle-cantidad" placeholder="Cantidad" min="1" value="1" required />
          <button type="button" class="btn-eliminar-detalle">🗑️</button>
        </div>
      `;
    }

    modal.classList.remove("hidden");

    function agregarDetalle() {
      const container = document.getElementById("dashboard-detalles-container");
      const detalleDiv = document.createElement("div");
      detalleDiv.className = "detalle-item";
      detalleDiv.innerHTML = `
        <select class="detalle-producto" required>
          <option value="">-- Seleccione Producto --</option>
          ${productos.map(producto => 
            `<option value="${producto.id}">${producto.nombre}</option>`
          ).join('')}
        </select>
        <input type="number" class="detalle-cantidad" placeholder="Cantidad" min="1" value="1" required />
        <button type="button" class="btn-eliminar-detalle">🗑️</button>
      `;
      container.appendChild(detalleDiv);
    }

    const form = document.getElementById("dashboard-form-editar");
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const tipoMovimiento = document.getElementById("dashboard-editar-tipo-mov").value;
      const comentario = document.getElementById("dashboard-editar-comentario").value;
      const bodegaOrigenId = document.getElementById("dashboard-editar-bodega-origen").value || 0;
      const bodegaDestinoId = document.getElementById("dashboard-editar-bodega-destino").value || 0;
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

      try {
        const url = `http://localhost:8080/api/admin/movimientos/${id}`;
        
        const payload = {
          tipoMovimiento: tipoMovimiento,
          comentario: comentario,
          bodegaOrigenId: parseInt(bodegaOrigenId) || 0,
          bodegaDestinoId: parseInt(bodegaDestinoId) || 0,
          fecha: fechaISO,
          detalles: detalles
        };

        console.log("Enviando payload:", payload);

        const response = await fetch(url, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();
        alert(`✅ Movimiento #${id} actualizado correctamente`);
        modal.classList.add("hidden");
        cargarMovimientos();

      } catch (error) {
        console.error("❌ Error al editar movimiento:", error);
        alert(`Error al actualizar el movimiento: ${error.message}`);
      }
    };

  } catch (error) {
    console.error("❌ Error al cargar datos para editar:", error);
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
