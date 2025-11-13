import { renderSidebarMenu } from '../components/menu.js';

  renderSidebarMenu('.targetSelector');

 // Datos simulados
const bodegas = [
  { id: "B001", nombre: "Bodega Central", ubicacion: "Ciudad Principal", capacidad: 5000, ocupacion: 75, encargado: "Juan Pérez" },
  { id: "B002", nombre: "Bodega Norte", ubicacion: "Zona Industrial Norte", capacidad: 3000, ocupacion: 50, encargado: "María González" },
];

const contenedor = document.getElementById("bodegasContainer");
const searchInput = document.getElementById("searchInput");

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
              <div class="progress-bar bg-success" style="width: ${b.ocupacion}%"></div>
            </div>
            <div class="text-end">
              <button class="btn btn-sm btn-warning me-2" onclick="editarBodega('${b.id}')">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button class="btn btn-sm btn-danger" onclick="eliminarBodega('${b.id}')">
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>`;
  });
}

function editarBodega(id) {
  const bodega = bodegas.find(b => b.id === id);
  Swal.fire({
    title: 'Editar Bodega',
    html: `
      <input id="nombre" class="swal2-input" value="${bodega.nombre}">
      <input id="ubicacion" class="swal2-input" value="${bodega.ubicacion}">
      <input id="encargado" class="swal2-input" value="${bodega.encargado}">
    `,
    confirmButtonText: 'Guardar',
    showCancelButton: true,
    preConfirm: () => Swal.fire('Guardado', 'Los cambios fueron aplicados', 'success')
  });
}

function eliminarBodega(id) {
  Swal.fire({
    title: '¿Eliminar esta bodega?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) Swal.fire('Eliminada', 'La bodega fue eliminada', 'success');
  });
}

document.getElementById("addBodegaBtn").addEventListener("click", () => {
  Swal.fire({
    title: 'Nueva Bodega',
    html: `
      <input id="nuevoNombre" class="swal2-input" placeholder="Nombre">
      <input id="nuevaUbicacion" class="swal2-input" placeholder="Ubicación">
      <input id="nuevoEncargado" class="swal2-input" placeholder="Encargado">
      <input id="nuevaCapacidad" type="number" class="swal2-input" placeholder="Capacidad">
    `,
    confirmButtonText: 'Agregar',
    showCancelButton: true,
    preConfirm: () => Swal.fire('Agregada', 'La bodega fue creada correctamente', 'success')
  });
});

searchInput.addEventListener("keyup", e => {
  const filtro = e.target.value.toLowerCase();
  const filtradas = bodegas.filter(b =>
    b.nombre.toLowerCase().includes(filtro) ||
    b.ubicacion.toLowerCase().includes(filtro) ||
    b.encargado.toLowerCase().includes(filtro)
  );
  mostrarBodegas(filtradas);
});

mostrarBodegas(bodegas);
