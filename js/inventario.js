import { renderSidebarMenu } from '../components/menu.js';
renderSidebarMenu('.targetSelector');

document.addEventListener('DOMContentLoaded', async () => {
  await cargarProductos();
});

async function cargarProductos() {
    try{
        const response = await fetch("http://localhost:8080/api/productos")
        const productos = await response.json()
        const productoContainer = document.getElementById("producto-data")

        productoContainer.innerHTML = ""; 


        productos.forEach(prod => {
            const div = document.createElement("div")
            div.className ="producto-card"
            div.innerHTML = `
                <h4>${prod.nombre}</h4>
                <p><b>${prod.categoria}</b></p>
                <p><b>$${prod.precio}</b></p>
                <p><b>${prod.stock} disponibles</b></p>
            `  
            div.addEventListener("click", () => mostrarVentanaEditar(prod));
            productoContainer.appendChild(div)
        });
    } catch (error){
        console.log(error);
        
    }
} 

function mostrarVentanaEditar(producto) {
  const modal = document.getElementById("modal-editar");
  modal.classList.remove("hidden");

  document.getElementById("editar-nombre").value = producto.nombre;
  document.getElementById("editar-categoria").value = producto.categoria;
  document.getElementById("editar-precio").value = producto.precio;
  document.getElementById("editar-stock").value = producto.stock;

  document.getElementById("cerrar-modal").onclick = () => {
    modal.classList.add("hidden");
  };

  const form = document.getElementById("form-editar");
  form.onsubmit = async (e) => {
    e.preventDefault();

    const datosActualizados = {
      nombre: document.getElementById("editar-nombre").value,
      categoria: document.getElementById("editar-categoria").value,
      precio: Number(document.getElementById("editar-precio").value),
      stock: Number(document.getElementById("editar-stock").value)
    };

    await guardarCambiosProducto(producto, datosActualizados);
  };
}

async function guardarCambiosProducto(productoActual, datosActualizados) {
  try {
    const response = await fetch(`http://localhost:8080/api/productos/${productoActual.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...productoActual, ...datosActualizados })
    });

    if (!response.ok) throw new Error("Error al actualizar el producto");

    alert("✅ Producto actualizado correctamente");

    document.getElementById("modal-editar").classList.add("hidden");
    cargarProductos(); 
  } catch (error) {
    console.error("❌ Error al guardar cambios:", error);
    alert("Hubo un problema al guardar los cambios");
  }
}
