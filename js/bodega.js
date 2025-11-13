import { renderSidebarMenu } from '../components/menu.js';

  renderSidebarMenu('.targetSelector');

const API_URL = "http://localhost:8080/api/bodegas";

const contenedor = document.getElementById("bodegasContainer");
const searchInput = document.getElementById("searchInput");

async function cargarBodegas() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener las bodegas");
    const data = await res.json();
    mostrarBodegas(data);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudieron cargar las bodegas", "error");
  }
}

function mostrarBodegas(lista) {
  contenedor.innerHTML = "";
  lista.forEach(b => {
    contenedor.innerHTML += `
      <div class="col-xl-4 col-md-6">
        <div class="card card-bodega shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="card-title">${b.nombre}</h5>
              <span class="badge bg-secondary">${b.id}</span>
            </div>
            <p class="mb-1"><strong>Ubicación:</strong> ${b.ubicacion}</p>
            <p class="mb-1"><strong>Encargado:</strong> ${b.encargado}</p>
            <p class="mb-2"><strong>Capacidad:</strong> ${b.capacidad} unidades</p>
            <div class="progress mb-3">
              <div class="progress-bar bg-success" style="width: ${b.ocupacion || 0}%"></div>
            </div>
            <div class="text-end">
              <button class="btn btn-sm btn-warning me-2" onclick="editarBodega('${b.id}')">
                ✏️ Editar
              </button>
              <button class="btn btn-sm btn-danger" onclick="eliminarBodega('${b.id}')">
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>`;
  });
}

document.getElementById("addBodegaBtn").addEventListener("click", async () => {
  const { value: formValues } = await Swal.fire({
    title: "Nueva Bodega",
    html: `
      <input id="nuevoNombre" class="swal2-input" placeholder="Nombre">
      <input id="nuevaUbicacion" class="swal2-input" placeholder="Ubicación">
      <input id="nuevoEncargado" class="swal2-input" placeholder="Encargado">
      <input id="nuevaCapacidad" type="number" class="swal2-input" placeholder="Capacidad">
    `,
    focusConfirm: false,
    confirmButtonText: "Agregar",
    showCancelButton: true,
    preConfirm: () => {
      const nombre = document.getElementById("nuevoNombre").value.trim();
      const ubicacion = document.getElementById("nuevaUbicacion").value.trim();
      const encargado = document.getElementById("nuevoEncargado").value.trim();
      const capacidad = parseInt(document.getElementById("nuevaCapacidad").value);
      if (!nombre || !ubicacion || !encargado || isNaN(capacidad)) {
        Swal.showValidationMessage("Todos los campos son obligatorios");
        return false;
      }
      return { nombre, ubicacion, encargado, capacidad };
    }
  });

  if (formValues) {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues)
      });
      Swal.fire("Agregada", "La bodega fue creada correctamente", "success");
      cargarBodegas();
    } catch (err) {
      Swal.fire("Error", "No se pudo crear la bodega", "error");
    }
  }
});

async function editarBodega(id) {
  try {
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
      confirmButtonText: "Guardar",
      showCancelButton: true,
      preConfirm: () => ({
        nombre: document.getElementById("nombre").value,
        ubicacion: document.getElementById("ubicacion").value,
        encargado: document.getElementById("encargado").value,
        capacidad: parseInt(document.getElementById("capacidad").value)
      })
    });

    if (formValues) {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues)
      });
      Swal.fire("Guardado", "Los cambios fueron aplicados", "success");
      cargarBodegas();
    }
  } catch (err) {
    Swal.fire("Error", "No se pudo editar la bodega", "error");
  }
}

async function eliminarBodega(id) {
  const result = await Swal.fire({
    title: "¿Eliminar esta bodega?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar"
  });

  if (result.isConfirmed) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      Swal.fire("Eliminada", "La bodega fue eliminada", "success");
      cargarBodegas();
    } catch (err) {
      Swal.fire("Error", "No se pudo eliminar la bodega", "error");
    }
  }
}

searchInput.addEventListener("keyup", async e => {
  const filtro = e.target.value.toLowerCase();
  try {
    const res = await fetch(API_URL);
    const bodegas = await res.json();
    const filtradas = bodegas.filter(b =>
      b.nombre.toLowerCase().includes(filtro) ||
      b.ubicacion.toLowerCase().includes(filtro) ||
      b.encargado.toLowerCase().includes(filtro)
    );
    mostrarBodegas(filtradas);
  } catch {
    Swal.fire("Error", "No se pudo filtrar la lista", "error");
  }
});

cargarBodegas();
