import { cargarBodegas } from './bodega.js';
import { obtenerProductos } from './inventario.js';

let productosSeleccionados = [];
let bodegasDisponibles = [];
let todosLosProductos = [];

export async function initMover() {
  console.log('🔄 Inicializando módulo de mover...');
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  if (!userData?.rol) {
    console.error('❌ No se encontró usuario en sesión');
    return;
  }

  bodegasDisponibles = await cargarBodegas(userData);
  console.log(bodegasDisponibles);
  
  todosLosProductos = await obtenerProductos(userData.rol);
  renderProductos(todosLosProductos);

  const buscarInput = document.getElementById('mover-buscar-producto');
  if (buscarInput) {
    buscarInput.addEventListener('input', (e) => {
      buscarProductos(e.target.value);
    });
  }
}

function buscarProductos(termino) {
  const productosFiltrados = todosLosProductos.filter(prod =>
    prod.nombre.toLowerCase().includes(termino.toLowerCase()) ||
    prod.categoria.toLowerCase().includes(termino.toLowerCase())
  );
  renderProductos(productosFiltrados);
}

function renderProductos(productos = todosLosProductos) {
  const cont = document.getElementById("mover-productos-container");
  if (!cont) return;

  if (productos.length === 0) {
    cont.innerHTML = '<p class="mover-no-data">No se encontraron productos</p>';
    return;
  }

  cont.innerHTML = productos.map(prod => `
    <div class="mover-producto-card" data-producto-id="${prod.id}">
      <h4>${prod.nombre}</h4>
      <p><b>Categoría:</b> ${prod.categoria}</p>
      <p><b>Precio:</b> $${prod.precio}</p>
      <p><b>Stock:</b> ${prod.stock} disponibles</p>
      <button class="mover-btn-agregar">➕ Agregar al movimiento</button>
    </div>
  `).join('');

  cont.querySelectorAll('.mover-producto-card').forEach(card => {
    const btn = card.querySelector('.mover-btn-agregar');
    const productoId = parseInt(card.dataset.productoId);
    btn.addEventListener('click', () => agregarProducto(productoId));
  });
}

function agregarProducto(productoId) {
  const producto = todosLosProductos.find(p => p.id === productoId);
  if (!producto) return;
  const existente = productosSeleccionados.find(p => p.id === productoId);
  if (existente) {
    existente.cantidad += 1;
  } else {
    productosSeleccionados.push({
      id: producto.id,
      nombre: producto.nombre,
      cantidad: 1,
      stock: producto.stock
    });
  }
  actualizarListaSeleccionados();
}

function actualizarListaSeleccionados() {
  const cont = document.getElementById("mover-productos-seleccionados");
  if (!cont) return;

  if (productosSeleccionados.length === 0) {
    cont.innerHTML = `<div class="mover-lista-vacia">
      <p>No hay productos seleccionados</p>
      <small>Haz clic en "Agregar al movimiento" para seleccionar productos</small>
    </div>`;
    return;
  }

  cont.innerHTML = productosSeleccionados.map(producto => `
    <div class="mover-producto-seleccionado">
      <div class="mover-producto-info">
        <h5>${producto.nombre}</h5>
        <p>Stock disponible: ${producto.stock}</p>
      </div>
      <div class="mover-controls-cantidad">
        <button class="mover-btn-cantidad mover-btn-decrementar" data-id="${producto.id}">-</button>
        <input type="number" class="mover-input-cantidad" value="${producto.cantidad}" min="1" max="${producto.stock}" data-id="${producto.id}">
        <button class="mover-btn-cantidad mover-btn-incrementar" data-id="${producto.id}">+</button>
      </div>
      <button class="mover-btn-eliminar" data-id="${producto.id}">🗑️</button>
    </div>
  `).join('') + `
    <button class="mover-btn-confirmar" id="mover-btn-confirmar">
      ✅ Confirmar Productos Seleccionados (${productosSeleccionados.length})
    </button>
  `;

  agregarEventListenersControles();
}

function agregarEventListenersControles() {
  const cont = document.getElementById("mover-productos-seleccionados");
  if (!cont) return;

  cont.querySelectorAll('.mover-btn-decrementar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productoId = parseInt(e.target.dataset.id);
      const producto = productosSeleccionados.find(p => p.id === productoId);
      if (producto && producto.cantidad > 1) {
        producto.cantidad -= 1;
        actualizarListaSeleccionados();
      }
    });
  });

  cont.querySelectorAll('.mover-btn-incrementar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productoId = parseInt(e.target.dataset.id);
      const producto = productosSeleccionados.find(p => p.id === productoId);
      if (producto && producto.cantidad < producto.stock) {
        producto.cantidad += 1;
        actualizarListaSeleccionados();
      }
    });
  });

  cont.querySelectorAll('.mover-input-cantidad').forEach(input => {
    input.addEventListener('change', (e) => {
      const productoId = parseInt(e.target.dataset.id);
      const nuevaCantidad = parseInt(e.target.value);
      const producto = productosSeleccionados.find(p => p.id === productoId);
      if (producto) {
        const cantidadFinal = Math.max(1, Math.min(nuevaCantidad, producto.stock));
        producto.cantidad = cantidadFinal;
        actualizarListaSeleccionados();
      }
    });
  });

  cont.querySelectorAll('.mover-btn-eliminar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productoId = parseInt(e.target.dataset.id);
      productosSeleccionados = productosSeleccionados.filter(p => p.id !== productoId);
      actualizarListaSeleccionados();
    });
  });

  const btnConfirmar = cont.querySelector('#mover-btn-confirmar');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', mostrarModalBodegas);
  }
}

function mostrarModalBodegas() {
  if (productosSeleccionados.length === 0) {
    alert("❌ Debes seleccionar al menos un producto");
    return;
  }

  let modal = document.getElementById("mover-modal-bodegas");
  if (modal) {
    crearModal();
    modal = document.getElementById("mover-modal-bodegas");
  }
  const resumenLista = document.getElementById("mover-resumen-lista");
  if (resumenLista) {
    resumenLista.innerHTML = productosSeleccionados.map(p =>
      `<div class="mover-resumen-item">${p.nombre} - Cantidad: ${p.cantidad}</div>`
    ).join('');
  }

  modal.classList.remove("hidden");
}
function crearModal() {
  console.log("Entre")
  const existingModal = document.getElementById("mover-modal-bodegas");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "mover-modal-bodegas";
  modal.className = "mover-modal hidden";
  modal.innerHTML = `
    <div class="mover-modal-content">
      <span class="mover-close" id="mover-cerrar-modal">&times;</span>
      <h3>📝 Completar Información del Movimiento</h3>
      <form id="mover-form-movimiento" class="mover-form">
        <div class="mover-form-group">
          <label for="mover-tipo-movimiento">📋 Tipo de Movimiento:</label>
          <select id="mover-tipo-movimiento" required class="mover-select">
            <option value="">-- Seleccione tipo --</option>
            <option value="ENTRADA">📥 ENTRADA</option>
            <option value="SALIDA">📤 SALIDA</option>
            <option value="TRASLADO">🔄 TRASLADO</option>
          </select>
        </div>
        <div class="mover-form-group" id="mover-group-origen">
          <label for="mover-bodega-origen">🏭 Bodega Origen:</label>
          <select id="mover-bodega-origen" class="mover-select">
            <option value="">-- Seleccione Bodega Origen --</option>
            ${bodegasDisponibles.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="mover-form-group" id="mover-group-destino">
          <label for="mover-bodega-destino">🏠 Bodega Destino:</label>
          <select id="mover-bodega-destino" class="mover-select">
            <option value="">-- Seleccione Bodega Destino --</option>
            ${bodegasDisponibles.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="mover-form-group">
          <label for="mover-comentario">💬 Comentario:</label>
          <textarea id="mover-comentario" rows="3" placeholder="Descripción del movimiento..." class="mover-textarea"></textarea>
        </div>
        <div class="mover-resumen-productos">
          <h4>📋 Resumen de Productos:</h4>
          <div id="mover-resumen-lista">
            ${productosSeleccionados.map(p => 
              `<div class="mover-resumen-item">${p.nombre} - Cantidad: ${p.cantidad}</div>`
            ).join('')}
          </div>
        </div>
        <div class="mover-form-actions">
          <button type="submit" class="mover-btn-primary">✅ Crear Movimiento</button>
          <button type="button" id="mover-btn-cancelar" class="mover-btn-secondary">❌ Cancelar</button>
        </div>
      </form>
    </div>
  `;
  console.log(bodegasDisponibles.map(b => b.nombre))

  document.body.appendChild(modal);
  configurarEventListenersModal(modal);
}

function configurarEventListenersModal(modal) {
  document.getElementById('mover-cerrar-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('mover-btn-cancelar').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('mover-tipo-movimiento').addEventListener('change', function() {
    const tipo = this.value;
    const origenGroup = document.getElementById('mover-group-origen');
    const destinoGroup = document.getElementById('mover-group-destino');
    
    if (tipo === 'ENTRADA') {
      origenGroup.style.display = 'none';
      destinoGroup.style.display = 'block';
    } else if (tipo === 'SALIDA') {
      origenGroup.style.display = 'block';
      destinoGroup.style.display = 'none';
    } else if (tipo === 'TRASLADO') {
      origenGroup.style.display = 'block';
      destinoGroup.style.display = 'block';
    }
  });

  document.getElementById('mover-form-movimiento').addEventListener('submit', crearMovimiento);
}

async function crearMovimiento(e) {
  e.preventDefault();
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const tipo = document.getElementById("mover-tipo-movimiento").value;
  const origen = document.getElementById("mover-bodega-origen").value;
  const destino = document.getElementById("mover-bodega-destino").value;
  const comentario = document.getElementById("mover-comentario").value;

  if (!tipo) return alert("❌ Selecciona tipo de movimiento");
  if (tipo === 'TRASLADO' && (!origen || !destino)) return alert("❌ Para traslados necesitas ambas bodegas");
  if (tipo === 'ENTRADA' && !destino) return alert("❌ Para entradas necesitas bodega destino");
  if (tipo === 'SALIDA' && !origen) return alert("❌ Para salidas necesitas bodega origen");

  try {
    const payload = {
      usuarioId: userData.id,
      tipoMovimiento: tipo,
      comentario: comentario,
      bodegaOrigenId: tipo === 'ENTRADA' ? 0 : parseInt(origen),
      bodegaDestinoId: tipo === 'SALIDA' ? 0 : parseInt(destino),
      fecha: new Date().toISOString(),
      detalles: productosSeleccionados.map(p => ({
        productoId: p.id,
        cantidad: p.cantidad
      }))
    };

    console.log("📦 Enviando movimiento:", payload);

    const response = await fetch(`http://localhost:8080/api/admin/movimientos?usuarioId=${userData.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userData.token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());

    alert("✅ Movimiento creado correctamente");
    document.getElementById("mover-modal-bodegas").classList.add("hidden");
    productosSeleccionados = [];
    actualizarListaSeleccionados();
    
    todosLosProductos = await obtenerProductos(userData.rol);
    renderProductos(todosLosProductos);

  } catch (error) {
    console.error("❌ Error al crear movimiento:", error);
    alert(`Error al crear movimiento: ${error.message}`);
  }
}