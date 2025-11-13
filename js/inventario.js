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

        productos.forEach(prod => {
            const div = document.createElement("div")
            div.innerHTML = `
                <h4>${prod.nombre}</h4>
                <p><b>Categoria: ${prod.categoria}</b></p>
                <p><b>Precio: ${prod.precio}</b></p>
                <p><b>Stock: ${prod.stock}</b></p>
                <button class="btn-editar">Editar</button>
                <button class="btn-eliminar">Eliminar</button>
            `
            productoContainer.appendChild(div)
        });

    } catch (error){
        console.log(error);
        
    }
} 