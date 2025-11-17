export function initBodegas() {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const isAdmin = userData?.rol === "ADMIN";
  
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
    nuevoAddBtn.addEventListener("click", () => mostrarVentanaAgregarBodega());
  }

  cargarYRenderizarBodegas();

  async function cargarYRenderizarBodegas() {
    try {
      container.innerHTML = "<tr><td colspan='5' class='loading-message'>Cargando bodegas...</td></tr>";
      
      const bodegas = await cargarBodegas(userData);
      console.log("✅ Bodegas cargadas:", bodegas);
      
      renderBodegas(bodegas, isAdmin);
      
    } catch (err) {
      console.error("❌ Error al cargar bodegas", err);
      container.innerHTML = `<tr><td colspan='5' class='error-message'>Error al cargar bodegas: ${err.message}</td></tr>`;
    }
  }

  function renderBodegas(bodegas, esAdmin) {
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
        </td>
        <td>${bodega.ubicacion || 'No especificada'}</td>
        <td>${bodega.encargadoUserName || 'No asignado'}</td>
        <td>
          <div class="bodega-actions">
            ${esAdmin ? `<button class="edit-bodega-btn" data-id="${bodega.id}">Editar</button>` : ""}
            ${esAdmin ? `<button class="delete-bodega-btn" data-id="${bodega.id}">Eliminar</button>` : ""}
          </div>
        </td>
      `;
      
      container.appendChild(row);
    });

    agregarEventListenersBodegas(bodegas, esAdmin);
  }

  function agregarEventListenersBodegas(bodegas, esAdmin) {
    document.querySelectorAll(".edit-bodega-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const bodegaId = e.target.getAttribute("data-id");
        const bodega = bodegas.find(b => b.id == bodegaId);
        if (bodega) {
          mostrarVentanaEditarBodega(bodega);
        }
      });
    });

    document.querySelectorAll(".delete-bodega-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const bodegaId = e.target.getAttribute("data-id");
        if (bodegaId) {
          eliminarBodega(bodegaId);
        }
      });
    });

    if (searchInput) {
      searchInput.oninput = function (e) {
        const q = e.target.value.toLowerCase();
        container.querySelectorAll("tr").forEach(row => {
          const text = row.innerText.toLowerCase();
          row.style.display = text.includes(q) ? "" : "none";
        });
      };
    }
  }

  function mostrarVentanaEditarBodega(bodega) {
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
        </form>
      `,
      async () => {
        await guardarCambiosBodega(bodega.id);
      }
    );
  }

  function mostrarVentanaAgregarBodega() {
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
        </form>
      `,
      async () => {
        await crearNuevaBodega();
      }
    );
  }

  async function guardarCambiosBodega(bodegaId) {
    try {
      const nombre = document.getElementById("editar-nombre").value.trim();
      const ubicacion = document.getElementById("editar-ubicacion").value.trim();
      const capacidad = parseInt(document.getElementById("editar-capacidad").value, 10);
      const encargadoUserName = document.getElementById("editar-encargadoUserName").value.trim();
      
      if (!nombre || !ubicacion || isNaN(capacidad) || !encargadoUserName) {
        alert("Todos los campos son obligatorios");
        return false;
      }
      
      const requestBody = { 
        nombre, 
        ubicacion, 
        capacidad, 
        encargadoUserName
      };
      
      const url = `http://localhost:8080/api/admin/bodegas/${bodegaId}?usuarioId=${userData.id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        alert(`❌ Error al editar. Código: ${res.status}. ${errorText}`);
        return false;
      }
      
      alert("✅ Bodega editada correctamente");
      await cargarYRenderizarBodegas();
      return true;
      
    } catch (err) {
      console.error("❌ Error en edición:", err);
      alert("Error inesperado: " + err.message);
      return false;
    }
  }

  async function crearNuevaBodega() {
    try {
      const nombre = document.getElementById("nombre").value.trim();
      const ubicacion = document.getElementById("ubicacion").value.trim();
      const capacidad = parseInt(document.getElementById("capacidad").value, 10);
      const encargadoUserName = document.getElementById("encargadoUserName").value.trim();
      
      if (!nombre || !ubicacion || isNaN(capacidad) || !encargadoUserName) {
        alert("Todos los campos son obligatorios");
        return false;
      }
      
      const requestBody = { 
        nombre, 
        ubicacion, 
        capacidad, 
        encargadoUserName,
        activo: true
      };
      
      const url = `http://localhost:8080/api/admin/bodegas?usuarioId=${userData.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        alert(`❌ Error al crear. Código: ${res.status}. ${errorText}`);
        return false;
      }
      
      alert("✅ Bodega creada correctamente");
      await cargarYRenderizarBodegas();
      return true;
      
    } catch (err) {
      console.error("❌ Error en creación:", err);
      alert("Error inesperado: " + err.message);
      return false;
    }
  }

  async function eliminarBodega(id) {
    if (!confirm("¿Seguro que deseas eliminar esta bodega?")) return;
    
    try {
      const url = `http://localhost:8080/api/admin/bodegas/${id}?usuarioId=${userData.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${userData.token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        alert(`❌ Error al eliminar. Código: ${res.status}. ${errorText}`);
        return;
      }
      
      alert("✅ Bodega eliminada correctamente");
      await cargarYRenderizarBodegas();
      
    } catch (err) {
      console.error("❌ Error en eliminación:", err);
      alert("Error inesperado: " + err.message);
    }
  }

  function openModal(title, bodyHTML, onConfirm) {
    modalTitle.innerText = title;
    modalBody.innerHTML = bodyHTML;
    modal.style.display = "flex";
    
    const form = modalBody.querySelector("form");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const success = await onConfirm();
        if (success) {
          modal.style.display = "none";
        }
      };
    }
    
    modalOk.onclick = null;
    modalCancel.onclick = null;
    
    modalCancel.onclick = () => {
      modal.style.display = "none";
    };
    
    modalOk.onclick = async (e) => {
      e?.preventDefault?.();
      const success = await onConfirm();
      if (success) {
        modal.style.display = "none";
      }
    };
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