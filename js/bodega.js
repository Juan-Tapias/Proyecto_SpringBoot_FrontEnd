export function initBodegas() {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const isAdmin = userData?.rol === "ADMIN";
  const bodegasBaseUrl = isAdmin
    ? `http://localhost:8080/api/admin/bodegas?usuarioId=${userData.id}`
    : `http://localhost:8080/api/empleado/bodegas/encargado?usuarioId=${userData.id}`;
  
  const container = document.getElementById("bodegasContainer");
  const addBtn = document.getElementById("addBodegaBtn");
  const modal = document.getElementById("bodega-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalOk = document.getElementById("modal-ok");
  const modalCancel = document.getElementById("modal-cancel");
  const searchInput = document.getElementById("searchInput");

  if (addBtn) {
    const nuevoAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(nuevoAddBtn, addBtn);
    nuevoAddBtn.addEventListener("click", showNewModal);
  }

  cargarBodegas();

  function openModal(title, bodyHTML, onConfirm) {
    modalTitle.innerText = title;
    modalBody.innerHTML = bodyHTML;
    modal.style.display = "flex";
    
    const form = modalBody.querySelector("form");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await onConfirm();
      };
    }
    
    modalOk.onclick = null;
    modalCancel.onclick = null;
    modalCancel.onclick = () => {
      modal.style.display = "none";
      modalOk.onclick = null;
      modalCancel.onclick = null;
    };
    modalOk.onclick = async (e) => {
      e?.preventDefault?.();
      await onConfirm();
      modal.style.display = "none";
      modalOk.onclick = null;
      modalCancel.onclick = null;
    };
  }

  async function cargarBodegas() {
    container.innerHTML = "<tr><td colspan='5' class='loading-message'>Cargando bodegas...</td></tr>";
    try {
      console.log("🔍 Cargando bodegas desde:", bodegasBaseUrl)
      
      const res = await fetch(bodegasBaseUrl, {
        headers: { 
          "Authorization": `Bearer ${userData.token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("📊 Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      let bodegas = await res.json();
      console.log("✅ Bodegas cargadas:", bodegas);
      
      if (!Array.isArray(bodegas) || bodegas.length === 0) {
        container.innerHTML = "<tr><td colspan='5' class='empty-message'>No hay bodegas registradas.</td></tr>";
        return;
      }
      
      container.innerHTML = "";
      bodegas.forEach(bodega => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>
            <strong>${bodega.nombre}</strong>
            ${bodega.descripcion ? `<br><small>${bodega.descripcion}</small>` : ''}
          </td>
          <td>${bodega.ubicacion || 'No especificada'}</td>
          <td>
            <span class="tipo-badge ${bodega.tipo === 'PRINCIPAL' ? 'tipo-principal' : 'tipo-secundaria'}">
              ${bodega.tipo || 'SECUNDARIA'}
            </span>
          </td>
          <td>
            <div class="bodega-actions">
              ${isAdmin ? `<button class="edit-bodega-btn" data-id="${bodega.id}">Editar</button>` : ""}
              ${isAdmin ? `<button class="delete-bodega-btn" data-id="${bodega.id}">Eliminar</button>` : ""}
            </div>
          </td>
        `;
        
        container.appendChild(row);
      });

      // Event listeners para los botones
      document.querySelectorAll(".edit-bodega-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const bodegaId = e.target.getAttribute("data-id");
          const bodega = bodegas.find(b => b.id == bodegaId);
          if (bodega) {
            abrirVentanaEditarBodega(bodega);
          }
        });
      });

      document.querySelectorAll(".delete-bodega-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const bodegaId = e.target.getAttribute("data-id");
          console.log("🗑️ Eliminando bodega ID:", bodegaId);
          if (bodegaId) {
            eliminarBodega(bodegaId);
          } else {
            console.error("❌ ID de bodega no encontrado");
            alert("Error: No se pudo identificar la bodega a eliminar");
          }
        });
      });

      document.querySelectorAll(".toggle-bodega-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const bodegaId = e.target.getAttribute("data-id");
          const activo = e.target.getAttribute("data-activo") === "true";
          console.log("🔄 Cambiando estado bodega ID:", bodegaId, "Activo:", activo);
          if (bodegaId) {
            toggleEstadoBodega(bodegaId, activo);
          }
        });
      });

      // Búsqueda en tabla
      if (searchInput) {
        searchInput.oninput = function (e) {
          const q = e.target.value.toLowerCase();
          container.querySelectorAll("tr").forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(q) ? "" : "none";
          });
        };
      }
      
    } catch (err) {
      console.error("❌ Error al cargar bodegas", err);
      container.innerHTML = `<tr><td colspan='5' class='error-message'>Error al cargar bodegas: ${err.message}</td></tr>`;
    }
  }

  function abrirVentanaEditarBodega(bodega) {
    console.log("📝 Editando bodega:", bodega);
    
    openModal(
      "Editar Bodega",
      `
        <form id="form-editar-bodega">
          <div class="form-group">
            <label>Nombre:</label>
            <input id="editar-nombre" value="${bodega.nombre || ''}" placeholder="Nombre" required>
          </div>
          <div class="form-group">
            <label>Ubicación:</label>
            <input id="editar-ubicacion" value="${bodega.ubicacion || ''}" placeholder="Ubicación" required>
          </div>
          <div class="form-group">
            <label>Capacidad:</label>
            <input id="editar-capacidad" type="number" value="${bodega.capacidad || ''}" placeholder="Capacidad" required>
          </div>
          <div class="form-group">
            <label>Usuario Encargado:</label>
            <input id="editar-encargadoUserName" value="${bodega.encargadoUserName || ''}" placeholder="Usuario encargado" required>
          </div>
          <div class="form-group">
            <label>Descripción:</label>
            <textarea id="editar-descripcion" placeholder="Descripción">${bodega.descripcion || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Tipo:</label>
            <select id="editar-tipo">
              <option value="PRINCIPAL" ${bodega.tipo === 'PRINCIPAL' ? 'selected' : ''}>Principal</option>
              <option value="SECUNDARIA" ${bodega.tipo === 'SECUNDARIA' ? 'selected' : ''}>Secundaria</option>
            </select>
          </div>
          <button type="submit" style="display:none"></button>
        </form>
      `,
      async () => {
        try {
          const nombre = document.getElementById("editar-nombre").value.trim();
          const ubicacion = document.getElementById("editar-ubicacion").value.trim();
          const capacidad = parseInt(document.getElementById("editar-capacidad").value, 10);
          const encargadoUserName = document.getElementById("editar-encargadoUserName").value.trim();
          const descripcion = document.getElementById("editar-descripcion").value.trim();
          const tipo = document.getElementById("editar-tipo").value;
          
          if (!nombre || !ubicacion || isNaN(capacidad) || !encargadoUserName) {
            alert("Todos los campos son obligatorios");
            return;
          }
          
          const requestBody = { 
            nombre, 
            ubicacion, 
            capacidad, 
            encargadoUserName,
            descripcion,
            tipo
          };
          
          console.log("📤 Editando bodega ID:", bodega.id, "Datos:", requestBody);
          
          const url = `http://localhost:8080/api/admin/bodegas/${bodega.id}?usuarioId=${userData.id}`;
          console.log("🔗 URL:", url);
          
          const res = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${userData.token}`
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log("📊 Edit response status:", res.status);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ Edit error:", errorText);
            alert(`❌ Error al editar. Código: ${res.status}. ${errorText}`);
            return;
          }
          
          alert("✅ Bodega editada correctamente");
          cargarBodegas();
          
        } catch (err) {
          console.error("❌ Error en edición:", err);
          alert("Error inesperado: " + err.message);
        }
      }
    );
  }
  
  async function eliminarBodega(id) {
    console.log("🗑️ Eliminando bodega ID:", id);
    
    if (!id) {
      console.error("❌ ID de bodega es undefined");
      alert("Error: No se pudo identificar la bodega a eliminar");
      return;
    }
    
    if (!confirm("¿Seguro que deseas eliminar esta bodega?")) return;
    
    try {
      const url = `http://localhost:8080/api/admin/bodegas/${id}?usuarioId=${userData.id}`;
      console.log("🔗 URL de eliminación:", url);
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${userData.token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("📊 Delete response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Delete error:", errorText);
        alert(`❌ Error al eliminar. Código: ${res.status}. ${errorText}`);
        return;
      }
      
      alert("✅ Bodega eliminada correctamente");
      cargarBodegas();
      
    } catch (err) {
      console.error("❌ Error en eliminación:", err);
      alert("Error inesperado: " + err.message);
    }
  }

  async function toggleEstadoBodega(id, activoActual) {
    console.log("🔄 Cambiando estado bodega ID:", id, "Nuevo estado:", !activoActual);
    
    if (!id) {
      console.error("❌ ID de bodega es undefined");
      alert("Error: No se pudo identificar la bodega");
      return;
    }
    
    if (!confirm(`¿Seguro que deseas ${activoActual ? 'desactivar' : 'activar'} esta bodega?`)) return;
    
    try {
      const url = `http://localhost:8080/api/admin/bodegas/${id}/estado?usuarioId=${userData.id}&activo=${!activoActual}`;
      console.log("🔗 URL de cambio de estado:", url);
      
      const res = await fetch(url, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${userData.token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("📊 Toggle response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Toggle error:", errorText);
        alert(`❌ Error al cambiar estado. Código: ${res.status}. ${errorText}`);
        return;
      }
      
      alert(`✅ Bodega ${activoActual ? 'desactivada' : 'activada'} correctamente`);
      cargarBodegas();
      
    } catch (err) {
      console.error("❌ Error en cambio de estado:", err);
      alert("Error inesperado: " + err.message);
    }
  }

  function showNewModal() {
    if (!isAdmin) {
      alert("Solo administradores pueden crear bodegas");
      return;
    }
    
    openModal(
      "Nueva Bodega",
      `
        <form id="form-nueva-bodega">
          <div class="form-group">
            <label>Nombre:</label>
            <input id="nombre" placeholder="Nombre" required>
          </div>
          <div class="form-group">
            <label>Ubicación:</label>
            <input id="ubicacion" placeholder="Ubicación" required>
          </div>
          <div class="form-group">
            <label>Capacidad:</label>
            <input id="capacidad" type="number" placeholder="Capacidad" required>
          </div>
          <div class="form-group">
            <label>Usuario Encargado:</label>
            <input id="encargadoUserName" placeholder="Usuario encargado" required>
          </div>
          <div class="form-group">
            <label>Descripción:</label>
            <textarea id="descripcion" placeholder="Descripción"></textarea>
          </div>
          <div class="form-group">
            <label>Tipo:</label>
            <select id="tipo">
              <option value="PRINCIPAL">Principal</option>
              <option value="SECUNDARIA" selected>Secundaria</option>
            </select>
          </div>
          <button type="submit" style="display:none"></button>
        </form>
      `,
      async () => {
        try {
          const nombre = document.getElementById("nombre").value.trim();
          const ubicacion = document.getElementById("ubicacion").value.trim();
          const capacidad = parseInt(document.getElementById("capacidad").value, 10);
          const encargadoUserName = document.getElementById("encargadoUserName").value.trim();
          const descripcion = document.getElementById("descripcion").value.trim();
          const tipo = document.getElementById("tipo").value;
          
          if (!nombre || !ubicacion || isNaN(capacidad) || !encargadoUserName) {
            alert("Todos los campos son obligatorios");
            return;
          }
          
          const requestBody = { 
            nombre, 
            ubicacion, 
            capacidad, 
            encargadoUserName,
            descripcion,
            tipo,
            activo: true
          };
          
          console.log("📤 Creando bodega:", requestBody);
          
          const url = `http://localhost:8080/api/admin/bodegas?usuarioId=${userData.id}`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${userData.token}`
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log("📊 Create response status:", res.status);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ Create error:", errorText);
            alert(`❌ Error al crear. Código: ${res.status}. ${errorText}`);
            return;
          }
          
          alert("✅ Bodega creada correctamente");
          cargarBodegas();
          
        } catch (err) {
          console.error("❌ Error en creación:", err);
          alert("Error inesperado: " + err.message);
        }
      }
    );
  }
}

export async function cargarBodegas(userData) {
  try {
    const isAdmin = userData?.rol === "ADMIN";
    const url = isAdmin
      ? `http://localhost:8080/api/admin/bodegas?usuarioId=${userData.id}`
      : `http://localhost:8080/api/empleado/bodegas/encargado?usuarioId=${userData.id}`;

    console.log("🔍 Cargando bodegas desde:", url);
    
    const res = await fetch(url, {
      headers: { 
        "Authorization": `Bearer ${userData.token}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("📊 Response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const bodegas = await res.json();
    console.log("✅ Bodegas cargadas:", bodegas.length);
    
    return bodegas;
    
  } catch (err) {
    console.error("❌ Error al cargar bodegas", err);
    throw err;
  }
}