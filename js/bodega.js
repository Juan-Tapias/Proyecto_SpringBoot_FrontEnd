import { renderSidebarMenu } from '../components/menu.js';

  renderSidebarMenu('.targetSelector');

const API_URL = "http://localhost:8080/api/bodegas";

const container = document.getElementById("bodegasContainer");
const addBtn = document.getElementById("addBodegaBtn");

// Cargar bodegas
async function cargarBodegas() {
  container.innerHTML = "";
  try {
    const res = await fetch(API_URL);
    const bodegas = await res.json();

    bodegas.forEach(bodega => {
      const card = document.createElement("div");
      card.classList.add("bodega-card");
      card.innerHTML = `
        <h3>${bodega.nombre}</h3>
        <small>${bodega.id}</small>
        <p><b>Ubicación:</b> ${bodega.ubicacion}</p>
        <p><b>Encargado:</b> ${bodega.encargado}</p>
        <p><b>Capacidad:</b> ${bodega.capacidad} unidades</p>
        <div class="progress"><div class="progress-bar" style="width: ${Math.min(bodega.capacidad / 100, 100)}%;"></div></div>
        <div class="actions">
          <button class="edit-btn" onclick="editarBodega('${bodega.id}')">✏️ Editar</button>
          <button class="delete-btn" onclick="eliminarBodega('${bodega.id}')">🗑️ Eliminar</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error al cargar bodegas:", err);
  }
}

// Crear bodega con SweetAlert
addBtn.addEventListener("click", async () => {
  const { value: formValues } = await Swal.fire({
    title: "Nueva Bodega",
    html: `
      <input id="nombre" class="swal2-input" placeholder="Nombre">
      <input id="ubicacion" class="swal2-input" placeholder="Ubicación">
      <input id="encargado" class="swal2-input" placeholder="Encargado">
      <input id="capacidad" type="number" class="swal2-input" placeholder="Capacidad">
    `,
    confirmButtonText: "Guardar",
    showCancelButton: true,
    focusConfirm: false,
    preConfirm: () => {
      const nombre = document.getElementById("nombre").value.trim();
      const ubicacion = document.getElementById("ubicacion").value.trim();
      const encargado = document.getElementById("encargado").value.trim();
      const capacidad = parseInt(document.getElementById("capacidad").value);
      if (!nombre || !ubicacion || !encargado || isNaN(capacidad)) {
        Swal.showValidationMessage("Todos los campos son obligatorios");
        return false;
      }
      return { nombre, ubicacion, encargado, capacidad };
    }
  });

  if (formValues) {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues)
    });
    Swal.fire("✅ Agregada", "La bodega fue creada correctamente", "success");
    cargarBodegas();
  }
});

// Editar
async function editarBodega(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const bodega = await res.json();

  const { value: formValues } = await Swal.fire({
    title: "Editar Bodega",
    html: `
      <input id="nombre" class="swal2-input" value="${bodega.nombre}">
      <input id="ubicacion" class="swal2-input" value="${bodega.ubicacion}">
      <input id="encargado" class="swal2-input" value="${bodega.encargado}">
      <input id="capacidad" type="number" class="swal2-input" value="${bodega.capacidad}">
    `,
    confirmButtonText: "Guardar Cambios",
    showCancelButton: true,
    preConfirm: () => {
      return {
        nombre: document.getElementById("nombre").value.trim(),
        ubicacion: document.getElementById("ubicacion").value.trim(),
        encargado: document.getElementById("encargado").value.trim(),
        capacidad: parseInt(document.getElementById("capacidad").value)
      };
    }
  });

  if (formValues) {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues)
    });
    Swal.fire("✅ Editada", "La bodega fue actualizada", "success");
    cargarBodegas();
  }
}

// Eliminar
async function eliminarBodega(id) {
  const confirm = await Swal.fire({
    title: "¿Eliminar bodega?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (confirm.isConfirmed) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    Swal.fire("Eliminada", "La bodega fue eliminada correctamente", "success");
    cargarBodegas();
  }
}

cargarBodegas();