export async function initProductos() {
  console.log('🔄 Inicializando módulo de productos...');

  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const rol = userData?.rol;

  if (!rol) {
    console.error('❌ No se encontró el rol en sessionStorage');
    return;
  }

  await cargarProductos(rol);
  agregarEventListeners(rol);
}

function agregarEventListeners(rol) {
  const btnAgregar = document.getElementById('btn-agregar-producto');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => mostrarVentanaAgregar(rol));
  }
}

async function cargarProductos(rol) {
  try {
    console.log('📦 Cargando productos...');

    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const token = userData?.token;

    const url = rol === "ADMIN"
      ? "http://localhost:8080/api/admin/productos"
      : "http://localhost:8080/api/empleado/productos";

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const productos = await response.json();
    const cont = document.getElementById("producto-data");
    if (!cont) return;

    cont.innerHTML = "";

    if (!productos || productos.length === 0) {
      cont.innerHTML = "<p class='no-data'>No hay productos registrados</p>";
      return;
    }

    productos.forEach(prod => {
      const card = document.createElement("div");
      card.className = "producto-card";

      card.innerHTML = `
        <h4>${prod.nombre}</h4>
        <p><b>${prod.categoria}</b></p>
        <p><b>$${prod.precio}</b></p>
        <p><b>${prod.stock} disponibles</b></p>
      `;

      if (rol === "ADMIN") {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => mostrarVentanaEditar(prod, rol));
      }

      cont.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    const cont = document.getElementById("producto-data");
    if (cont) cont.innerHTML = "<p class='error-message'>Error al cargar los productos</p>";
  }
}


async function eliminarProducto(productoId, rol) {
  if (!confirm(`¿Eliminar el producto #${productoId}?`)) return;

  try {
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const usuarioId = userData?.id;

    if (!usuarioId) {
      alert("❌ No se encontró el usuario en sesión");
      return;
    }

    const url = rol === "ADMIN"
      ? `http://localhost:8080/api/admin/productos/${productoId}?usuarioId=${usuarioId}`
      : `http://localhost:8080/api/empleado/productos/${productoId}?usuarioId=${usuarioId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${userData.token}`
      }
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    alert("Producto eliminado correctamente");
    document.getElementById("modal-editar").classList.add("hidden");
    await cargarProductos(rol);

  } catch (err) {
    console.error("❌ Error eliminando:", err);
    alert("Error eliminando el producto");
  }
}



function mostrarVentanaEditar(producto, rol) {
  const modal = document.getElementById("modal-editar");
  if (!modal) return;

  modal.classList.remove("hidden");

  document.getElementById("editar-nombre").value = producto.nombre;
  document.getElementById("editar-categoria").value = producto.categoria;
  document.getElementById("editar-precio").value = producto.precio;
  document.getElementById("editar-stock").value = producto.stock;

  document.getElementById("cerrar-modal").onclick =
    () => modal.classList.add("hidden");

  const form = document.getElementById("form-editar");
  form.onsubmit = async e => {
    e.preventDefault();

    const datosActualizados = {
      nombre: document.getElementById("editar-nombre").value,
      categoria: document.getElementById("editar-categoria").value,
      precio: Number(document.getElementById("editar-precio").value),
      stock: Number(document.getElementById("editar-stock").value)
    };

    await guardarCambiosProducto(producto, datosActualizados, rol);
  };

  let btnEliminar = document.getElementById("btn-eliminar-producto");

  if (!btnEliminar) {
    btnEliminar = document.createElement("button");
    btnEliminar.id = "btn-eliminar-producto";
    btnEliminar.textContent = "🗑️ Eliminar producto";
    btnEliminar.classList.add("btn-eliminar");

    const modalContent = modal.querySelector(".modal-content");
    modalContent.appendChild(btnEliminar);
  }

  btnEliminar.onclick = () => eliminarProducto(producto.id, rol);
}


async function guardarCambiosProducto(productoActual, datosActualizados, rol) {
  try {
    const userData = JSON.parse(sessionStorage.getItem("userData"));

    const url = rol === "ADMIN"
      ? `http://localhost:8080/api/admin/productos/${productoActual.id}`
      : `http://localhost:8080/api/empleado/productos/${productoActual.id}`;

    const payload = {
      ...productoActual,
      ...datosActualizados,
      usuarioId: userData.id
    };

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userData.token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());

    alert("Producto actualizado");
    document.getElementById("modal-editar").classList.add("hidden");
    await cargarProductos(rol);

  } catch (err) {
    console.error("❌ Error actualizando:", err);
    alert("Error guardando cambios");
  }
}



function mostrarVentanaAgregar(rol) {
  console.log('Mostrar ventana agregar producto');
}
