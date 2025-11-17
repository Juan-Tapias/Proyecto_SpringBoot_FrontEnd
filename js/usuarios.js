export function initUsuarios() {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const isAdmin = userData?.rol === "ADMIN";
  
  if (!isAdmin) {
    alert("Solo los administradores pueden acceder a esta sección");
    window.location.href = "/index.html";
    return;
  }
  
  const usuariosBaseUrl = "http://localhost:8080/api/admin/usuarios";
  
  const container = document.getElementById("usuariosContainer");
  const addBtn = document.getElementById("addUsuarioBtn");
  const modal = document.getElementById("usuario-modal");
  const modalTitle = document.getElementById("usuario-modal-title");
  const modalBody = document.getElementById("usuario-modal-body");
  const modalOk = document.getElementById("usuario-modal-ok");
  const modalCancel = document.getElementById("usuario-modal-cancel");
  const searchInput = document.getElementById("searchUsuariosInput");

  let usuariosActuales = [];

  if (addBtn) {
    const nuevoAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(nuevoAddBtn, addBtn);
    nuevoAddBtn.addEventListener("click", () => mostrarVentanaAgregarUsuario());
  }

  cargarYRenderizarUsuarios();

  async function cargarYRenderizarUsuarios() {
    try {
      container.innerHTML = "<tr><td colspan='5' class='loading-message'>Cargando usuarios...</td></tr>";
      
      usuariosActuales = await cargarUsuariosDesdeAPI();
      console.log("✅ Usuarios cargados:", usuariosActuales.length);
      
      renderizarUsuarios(usuariosActuales);
      
    } catch (err) {
      console.error("❌ Error al cargar usuarios", err);
      container.innerHTML = `<tr><td colspan='5' class='error-message'>Error al cargar usuarios: ${err.message}</td></tr>`;
    }
  }

  async function cargarUsuariosDesdeAPI() {
    console.log("🔍 Cargando usuarios desde:", usuariosBaseUrl);
    
    const res = await fetch(usuariosBaseUrl, {
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
    
    const usuarios = await res.json();
    console.log("✅ Usuarios cargados desde API:", usuarios.length);
    
    return usuarios;
  }

  function renderizarUsuarios(usuarios) {
    console.log("🎨 Renderizando usuarios:", usuarios.length);
    
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      console.log("📭 No hay usuarios para renderizar");
      container.innerHTML = "<tr><td colspan='5' class='empty-message'>No hay usuarios registrados.</td></tr>";
      return;
    }
    
    container.innerHTML = "";
    usuarios.forEach(usuario => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <strong>${usuario.nombre}</strong>
        </td>
        <td>@${usuario.username}</td>
        <td>
          <span class="rol-badge rol-${usuario.rol.toLowerCase()}">
            ${usuario.rol}
          </span>
        </td>
        <td>
          <div class="usuario-actions">
            <button class="edit-usuario-btn" data-id="${usuario.id}" title="Editar usuario">
              Editar
            </button>
            <button class="delete-usuario-btn" data-id="${usuario.id}" data-username="${usuario.username}" title="Eliminar usuario">
              Eliminar
            </button>
          </div>
        </td>
      `;
      
      container.appendChild(row);
    });

    agregarEventListenersUsuarios();
  }

  function agregarEventListenersUsuarios() {
    console.log("🔗 Agregando event listeners a usuarios");

    document.querySelectorAll(".edit-usuario-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const usuarioId = e.target.getAttribute("data-id");
        const usuario = usuariosActuales.find(u => u.id == usuarioId);
        if (usuario) {
          mostrarVentanaEditarUsuario(usuario);
        } else {
          console.error("❌ Usuario no encontrado para editar, ID:", usuarioId);
          alert("Error: No se pudo encontrar el usuario para editar");
        }
      });
    });

    document.querySelectorAll(".delete-usuario-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const usuarioId = e.target.getAttribute("data-id");
        const username = e.target.getAttribute("data-username");
        if (usuarioId) {
          eliminarUsuario(username);
        } else {
          console.error("❌ ID de usuario no encontrado");
          alert("Error: No se pudo identificar el usuario a eliminar");
        }
      });
    });

    if (searchInput) {
      searchInput.oninput = function (e) {
        const query = e.target.value.toLowerCase();
        container.querySelectorAll("tr").forEach(row => {
          const text = row.innerText.toLowerCase();
          row.style.display = text.includes(query) ? "" : "none";
        });
      };
    }
  }

  function mostrarVentanaEditarUsuario(usuario) {
    console.log("📝 Editando usuario:", usuario);
    
    openModal(
      "Editar Usuario",
      `
        <form id="form-editar-usuario">
          <label>Nombre completo:</label>
          <input id="editar-nombre" value="${usuario.nombre || ''}" placeholder="Nombre completo" required>
          
          <label>Username:</label>
          <input id="editar-username" value="${usuario.username || ''}" placeholder="Username" required>
          
          <label>Contraseña (dejar vacío para no cambiar):</label>
          <input id="editar-password" type="password" placeholder="Nueva contraseña">
          
          <label>Rol:</label>
          <select id="editar-rol" required>
            <option value="ADMIN" ${usuario.rol === 'ADMIN' ? 'selected' : ''}>Administrador</option>
            <option value="EMPLEADO" ${usuario.rol === 'EMPLEADO' ? 'selected' : ''}>Empleado</option>
          </select>
        </form>
      `,
      async () => {
        await guardarCambiosUsuario(usuario.id);
      }
    );
  }

  function mostrarVentanaAgregarUsuario() {
    openModal(
      "Nuevo Usuario",
      `
        <form id="form-nuevo-usuario">
          <label>Nombre completo:</label>
          <input id="nombre" placeholder="Nombre completo" required>
          
          <label>Username:</label>
          <input id="username" placeholder="Username" required>
          
          <label>Contraseña:</label>
          <input id="password" type="password" placeholder="Contraseña" required>
          
          <label>Rol:</label>
          <select id="rol" required>
            <option value="">Seleccionar rol</option>
            <option value="ADMIN">Administrador</option>
            <option value="EMPLEADO">Empleado</option>
          </select>
        </form>
      `,
      async () => {
        await crearNuevoUsuario();
      }
    );
  }

  async function guardarCambiosUsuario(usuarioId) {
    try {
      const nombre = document.getElementById("editar-nombre").value.trim();
      const username = document.getElementById("editar-username").value.trim();
      const password = document.getElementById("editar-password").value;
      const rol = document.getElementById("editar-rol").value;
      
      if (!nombre || !username || !rol) {
        alert("Nombre, username y rol son obligatorios");
        return false;
      }
      
      const requestBody = { 
        nombre, 
        username, 
        rol
      };
      
      if (password && password.length > 0) {
        requestBody.password = password;
      }
      
      console.log("📤 Editando usuario ID:", usuarioId, "Datos:", requestBody);
      
      const url = `${usuariosBaseUrl}/${usuarioId}`;
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
        return false;
      }
      
      alert("✅ Usuario editado correctamente");
      
      usuariosActuales = await cargarUsuariosDesdeAPI();
      renderizarUsuarios(usuariosActuales);
      
      return true;
      
    } catch (err) {
      console.error("❌ Error en edición:", err);
      alert("Error inesperado: " + err.message);
      return false;
    }
  }

  async function crearNuevoUsuario() {
    try {
      const nombre = document.getElementById("nombre").value.trim();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const rol = document.getElementById("rol").value;
      
      if (!nombre || !username || !password || !rol) {
        alert("Todos los campos son obligatorios");
        return false;
      }
      
      const requestBody = { 
        nombre, 
        username, 
        password, 
        rol
      };
      
      console.log("📤 Creando usuario:", requestBody);
      
      const res = await fetch(usuariosBaseUrl, {
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
        return false;
      }
      
      alert("✅ Usuario creado correctamente");
      
      usuariosActuales = await cargarUsuariosDesdeAPI();
      renderizarUsuarios(usuariosActuales);
      
      return true;
      
    } catch (err) {
      console.error("❌ Error en creación:", err);
      alert("Error inesperado: " + err.message);
      return false;
    }
  }

  async function eliminarUsuario(username) {
    if (!confirm(`¿Seguro que deseas eliminar al usuario @${username}? Esta acción no se puede deshacer.`)) return;
    
    try {
      const url = `${usuariosBaseUrl}/${username}`;
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
      
      alert("✅ Usuario eliminado correctamente");
      
      usuariosActuales = await cargarUsuariosDesdeAPI();
      renderizarUsuarios(usuariosActuales);
      
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

export async function cargarUsuarios(userData) {
  try {
    const usuariosBaseUrl = "http://localhost:8080/api/admin/usuarios";
    
    const res = await fetch(usuariosBaseUrl, {
      headers: { 
        "Authorization": `Bearer ${userData.token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const usuarios = await res.json();
    return usuarios;
    
  } catch (err) {
    console.error("❌ Error al cargar usuarios", err);
    throw err;
  }
}