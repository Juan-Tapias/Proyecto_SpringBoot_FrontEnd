export async function initProductos() {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const rol = userData?.rol;
  let productos = [];

  if (rol === "ADMIN") {
    productos = await cargarProductos("ADMIN");
  } else {
    productos = await cargarProductosPorBodegas(userData);
  }

  renderAgregarProductoCard(rol);
  renderProductos(productos, rol);
  agregarEventListeners(rol);
}


export async function cargarProductos(rol) {
  try {
    console.log('📦 Cargando productos...');

    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const token = userData?.token;

    let productos = [];

    if (rol === "ADMIN") {
      const response = await fetch("http://localhost:8080/api/admin/productos", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      productos = await response.json();

    } else {
      const bodegasResp = await fetch(
        `http://localhost:8080/api/empleado/bodegas/encargado?usuarioId=${userData.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!bodegasResp.ok) throw new Error(await bodegasResp.text());
      const bodegas = await bodegasResp.json();

      productos = [];

      for (const bodega of bodegas) {
        const respProd = await fetch(
          `http://localhost:8080/api/empleado/bodegas/${bodega.id}/productos`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!respProd.ok) continue;

        const prods = await respProd.json();

        prods.forEach(p => {
          p.bodega = bodega.nombre;
        });

        productos.push(...prods);
      }
    }

    return productos;  

  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    return [];
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
    const productos = await cargarProductos(rol);
    renderProductos(productos, rol);

  } catch (err) {
    console.error("❌ Error eliminando:", err);
    alert("Error eliminando el producto");
  }
}



function mostrarVentanaEditar(producto, rol) {

  console.log("Entre");
  

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

  console.log("Sali");
  
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
    const productos = await cargarProductos(rol);
    renderProductos(productos, rol);

  } catch (err) {
    console.error("❌ Error actualizando:", err);
    alert("Error guardando cambios");
  }
}

function mostrarVentanaAgregar(rol) {
  const modal = document.getElementById("modal-agregar");
  if (!modal) return;

  modal.classList.remove("hidden");

  const modalContent = modal.querySelector(".modal-content");
  modalContent.innerHTML = `
    <h3>Agregar producto</h3>
    <form id="form-agregar">
      <label>Nombre: <input id="agregar-nombre" type="text" required></label><br>
      <label>Categoría: <input id="agregar-categoria" type="text" required></label><br>
      <label>Precio: <input id="agregar-precio" type="number" step="0.01" required></label><br>
      <label>Stock: <input id="agregar-stock" type="number" required></label><br>
      <label>Activo: <input id="agregar-activo" type="checkbox" checked></label><br>
      <button type="submit" class="btn-agregar">Agregar producto</button>
      <button id="cerrar-modal-agregar" type="button">Cancelar</button>
    </form>
  `;

  document.getElementById("cerrar-modal-agregar").onclick =
    () => modal.classList.add("hidden");

  document.getElementById("form-agregar").onsubmit = async e => {
    e.preventDefault();

    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const usuarioId = userData.id;

    const nuevoProducto = {
      id: 0,
      nombre: document.getElementById("agregar-nombre").value,
      categoria: document.getElementById("agregar-categoria").value,
      stock: Number(document.getElementById("agregar-stock").value),
      precio: Number(document.getElementById("agregar-precio").value),
      activo: document.getElementById("agregar-activo").checked,
      usuarioId: usuarioId
    };

    const endpoint = rol === "ADMIN"
      ? `http://localhost:8080/api/admin/productos?usuarioId=${usuarioId}`
      : `http://localhost:8080/api/empleado/productos/crear?usuarioId=${usuarioId}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify(nuevoProducto)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("📌 Respuesta del backend:", text);
        throw new Error(text);
      }

      alert("Producto agregado correctamente");
      modal.classList.add("hidden");
      const productos = await cargarProductos(rol);
      renderProductos(productos, rol);
    } catch (err) {
      console.error("❌ Error agregando:", err);
      alert("Error al agregar el producto: " + err.message);
    }
  };
}

function renderAgregarProductoCard(rol) {
  const cont = document.getElementById("producto-data");
  if (!cont) return;

  const prev = document.getElementById("card-agregar-producto");
  if (prev) prev.remove();

  const card = document.createElement("div");
  card.className = "producto-card agregar-producto-card";
  card.id = "card-agregar-producto";

  card.innerHTML = `
    <h4 style="color: var(--primary, #6c63ff)">+ Agregar producto</h4>
  `;

  card.style.cursor = "pointer";
  card.addEventListener("click", () => mostrarVentanaAgregar(rol));

  cont.prepend(card);
}

export async function cargarProductosPorBodegas(userData) {
  try {
    if (!userData || !userData.rol || !userData.id) {
      console.error('❌ Datos de usuario incompletos');
      return [];
    }

    if (userData.rol === "ADMIN") {
      return [];
    }

    const urlBodegas = `http://localhost:8080/api/empleado/bodegas/encargado?usuarioId=${userData.id}`;
    const resBodegas = await fetch(urlBodegas, {
      headers: { 'Authorization': `Bearer ${userData.token}` }
    });

    if (!resBodegas.ok) throw new Error(`Error ${resBodegas.status}: ${await resBodegas.text()}`);

    const bodegas = await resBodegas.json();
    
    let productosTotales = [];

    for (const bodega of bodegas) {
      const urlProductos = `http://localhost:8080/api/empleado/bodegas/${bodega.id}/productos`;
      const resProductos = await fetch(urlProductos, {
        headers: { 'Authorization': `Bearer ${userData.token}` }
      });

      if (!resProductos.ok) {
        console.error(`Error al cargar productos de bodega ${bodega.nombre}`);
        continue;
      }

      const productosBodega = await resProductos.json();

      const productosMapeados = productosBodega.map(item => ({
        id: item.productoId,
        nombre: item.nombre,
        categoria: item.categoria,
        stock: item.stock,
        precio: item.precio ?? 0,
        bodega: bodega.nombre           
      }));

      productosTotales.push(...productosMapeados);
    }

    return productosTotales;

  } catch (error) {
    console.error('❌ Error cargando productos por bodegas:', error);
    return [];
  }
}

function agregarEventListeners(rol) {
  const btnAgregar = document.getElementById('btn-agregar-producto');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => mostrarVentanaAgregar(rol));
  }

}


function renderProductos(productos, rol) {
  const cont = document.getElementById("producto-data");
  if (!cont) return;

  if (!Array.isArray(productos)) {
    console.error("renderProductos: No se recibió un array válido:", productos);
    cont.innerHTML = "<p class='error-message'>Error cargando productos</p>";
    return;
  }

  const cardAgregar = document.getElementById("card-agregar-producto");

  cont.innerHTML = "";
  if (cardAgregar) cont.appendChild(cardAgregar);

  if (productos.length === 0) {
    cont.innerHTML += "<p class='no-data'>No hay productos disponibles</p>";
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
      ${rol !== "ADMIN" ? `<p><b>Bodega:</b> ${prod.bodega}</p>` : ""}
    `;

    if (rol === "ADMIN") {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => mostrarVentanaEditar(prod, rol));
    }

    cont.appendChild(card);
  });
}
