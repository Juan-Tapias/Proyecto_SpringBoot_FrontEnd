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
    const url = rol === "ADMIN" 
                ? "http://localhost:8080/api/admin/productos" 
                : "http://localhost:8080/api/empleado/productos";

    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const token = userData?.token;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text(); 
      throw new Error(`Error al obtener productos: ${response.status} - ${text}`);
    }

    const productos = await response.json(); 
    const productoContainer = document.getElementById("producto-data");

    if (!productoContainer) {
      console.error('❌ No se encontró el contenedor producto-data');
      return;
    }

    productoContainer.innerHTML = ""; 

    if (!productos || productos.length === 0) {
      productoContainer.innerHTML = '<p class="no-data">No hay productos registrados</p>';
      return;
    }

    productos.forEach(prod => {
      const div = document.createElement("div");
      div.className = "producto-card";
      div.innerHTML = `
        <h4>${prod.nombre}</h4>
        <p><b>${prod.categoria}</b></p>
        <p><b>$${prod.precio}</b></p>
        <p><b>${prod.stock} disponibles</b></p>
      `;
      if (rol === "ADMIN") {
        div.style.cursor = 'pointer';
        div.addEventListener("click", () => mostrarVentanaEditar(prod, rol));
      }
      productoContainer.appendChild(div);
    });

    console.log(`✅ ${productos.length} productos cargados correctamente`);

  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    const productoContainer = document.getElementById("producto-data");
    if (productoContainer) {
      productoContainer.innerHTML = '<p class="error-message">Error al cargar los productos</p>';
    }
  }
}

function mostrarVentanaEditar(producto, rol) {
  const modal = document.getElementById("modal-editar");
  if (!modal) {
    console.error('❌ No se encontró el modal modal-editar');
    return;
  }

  modal.classList.remove("hidden");

  document.getElementById("editar-nombre").value = producto.nombre;
  document.getElementById("editar-categoria").value = producto.categoria;
  document.getElementById("editar-precio").value = producto.precio;
  document.getElementById("editar-stock").value = producto.stock;

  const cerrarModal = document.getElementById("cerrar-modal");
  if (cerrarModal) {
    cerrarModal.onclick = () => modal.classList.add("hidden");
  }

  const form = document.getElementById("form-editar");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const datosActualizados = {
        nombre: document.getElementById("editar-nombre").value,
        categoria: document.getElementById("editar-categoria").value,
        precio: Number(document.getElementById("editar-precio").value),
        stock: Number(document.getElementById("editar-stock").value)
      };
      await guardarCambiosProducto(producto, datosActualizados, rol);
    };
  }
}

async function guardarCambiosProducto(productoActual, datosActualizados, rol) {
  try {
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    if (!userData?.id || !userData?.token) {
      throw new Error("Usuario no autenticado o token faltante");
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    alert("✅ Producto actualizado correctamente");
    document.getElementById("modal-editar").classList.add("hidden");

    await cargarProductos(rol); 
  } catch (error) {
    console.error("❌ Error al guardar cambios:", error);
    alert("Hubo un problema al guardar los cambios. Revisa la consola.");
  }
}


function mostrarVentanaAgregar(rol) {
  console.log('Mostrar ventana agregar producto');
}
