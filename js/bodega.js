import { renderSidebarMenu } from '../components/menu.js';

  renderSidebarMenu('.targetSelector');

const API_URL = "http://localhost:8080/api/bodegas";

const container = document.getElementById("bodegasContainer");
const addBtn = document.getElementById("addBodegaBtn");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalOk = document.getElementById("modal-ok");
const modalCancel = document.getElementById("modal-cancel");

// Función para abrir modal
function openModal(title, bodyHTML, onConfirm) {
  modalTitle.innerText = title;
  modalBody.innerHTML = bodyHTML;
  modal.style.display = "flex";

  const cleanup = () => { modal.style.display = "none"; modalOk.onclick = null; modalCancel.onclick = null; };
  modalCancel.onclick = cleanup;
  modalOk.onclick = () => { onConfirm(); cleanup(); };
}

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
          <button class="edit-btn">✏️ Editar</button>
          <button class="delete-btn">🗑️ Eliminar</button>
        </div>
      `;
      container.appendChild(card);

      // Editar
      card.querySelector(".edit-btn").onclick = () => {
        openModal("Editar Bodega", `
          <input id="nombre" value="${bodega.nombre}">
          <input id="ubicacion" value="${bodega.ubicacion}">
          <input id="encargado" value="${bodega.encargado}">
          <input id="capacidad" type="number" value="${bodega.capacidad}">
        `, async () => {
          const nombre = document.getElementById("nombre").value.trim();
          const ubicacion = document.getElementById("ubicacion").value.trim();
          const encargado = document.getElementById("encargado").value.trim();
          const capacidad = parseInt(document.getElementById("capacidad").value);
          if(!nombre || !ubicacion || !encargado || isNaN(capacidad)){
            alert("Todos los campos son obligatorios");
            return;
          }
          await fetch(`${API_URL}/${bodega.id}`, {
            method: "PUT",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({nombre, ubicacion, encargado, capacidad})
          });
          cargarBodegas();
        });
      };

      // Eliminar
      card.querySelector(".delete-btn").onclick = () => {
        openModal("Eliminar Bodega", `<p>¿Seguro que deseas eliminar la bodega <b>${bodega.nombre}</b>?</p>`, async () => {
          await fetch(`${API_URL}/${bodega.id}`, { method: "DELETE" });
          cargarBodegas();
        });
      };
    });
  } catch(err) {
    console.error("Error al cargar bodegas:", err);
  }
}

// Crear nueva bodega
addBtn.onclick = () => {
  openModal("Nueva Bodega", `
    <input id="nombre" placeholder="Nombre">
    <input id="ubicacion" placeholder="Ubicación">
    <input id="encargado" placeholder="Encargado">
    <input id="capacidad" type="number" placeholder="Capacidad">
  `, async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const ubicacion = document.getElementById("ubicacion").value.trim();
    const encargado = document.getElementById("encargado").value.trim();
    const capacidad = parseInt(document.getElementById("capacidad").value);
    if(!nombre || !ubicacion || !encargado || isNaN(capacidad)){
      alert("Todos los campos son obligatorios");
      return;
    }
    await fetch(API_URL, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({nombre, ubicacion, encargado, capacidad})
    });
    cargarBodegas();
  });
};

cargarBodegas();