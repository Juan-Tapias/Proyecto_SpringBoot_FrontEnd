// ======================================================
// 🗂️  CONFIGURACIÓN
// ======================================================

const userData = JSON.parse(sessionStorage.getItem("userData"));
const isAdmin = userData?.rol === "ADMIN";

const BASE_URL = isAdmin
    ? "http://localhost:8080/api/admin/bodegas"
    : `http://localhost:8080/api/empleado/bodegas?usuarioId=${userData?.id}`;


// ======================================================
// 📌 CARGAR BODEGAS
// ======================================================

export async function cargarBodegas() {
    try {
        const response = await fetch(BASE_URL);

        if (!response.ok) throw new Error("HTTP " + response.status);

        const bodegas = await response.json();
        mostrarBodegas(bodegas);

    } catch (error) {
        console.error("❌ Error al cargar bodegas:", error);
    }
}


// ======================================================
// 📌 MOSTRAR BODEGAS EN CARDS
// ======================================================

function mostrarBodegas(bodegas) {
    const cont = document.getElementById("bodegasContainer");
    cont.innerHTML = "";

    bodegas.forEach(b => {
        const card = document.createElement("div");
        card.classList.add("bodega-card");

        card.innerHTML = `
            <h3>${b.nombre}</h3>

            <p><strong>Ubicación:</strong> ${b.ubicacion}</p>
            <p><strong>Capacidad:</strong> ${b.capacidad}</p>
            <p><strong>Encargado:</strong> ${b.encargadoNombre ?? "Sin encargado"}</p>

            ${
                isAdmin
                    ? `
                    <div class="card-actions">
                        <button class="btn-editar" data-id="${b.id}">Editar</button>
                        <button class="btn-eliminar" data-id="${b.id}">Eliminar</button>
                    </div>
                    `
                    : ""
            }
        `;

        cont.appendChild(card);
    });

    if (isAdmin) activarBotonesEdicion();
}


// ======================================================
// 📌 BOTONES EDITAR / ELIMINAR
// ======================================================

function activarBotonesEdicion() {
    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", () => abrirModalEditar(btn.dataset.id));
    });

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", () => eliminarBodega(btn.dataset.id));
    });
}


// ======================================================
// 📌 ABRIR MODAL PARA CREAR
// ======================================================

document.getElementById("addBodegaBtn").addEventListener("click", () => {
    abrirModal("Nueva Bodega", `
        <label>Nombre</label>
        <input id="nombre" type="text">

        <label>Ubicación</label>
        <input id="ubicacion" type="text">

        <label>Capacidad</label>
        <input id="capacidad" type="number">

        <label>ID Encargado</label>
        <input id="encargadoId" type="number">
    `);

    document.getElementById("modal-ok").onclick = crearBodega;
});


// ======================================================
// 📌 ABRIR MODAL PARA EDITAR
// ======================================================

async function abrirModalEditar(id) {
    try {
        const response = await fetch(`http://localhost:8080/api/admin/bodegas/${id}`);

        if (!response.ok) throw new Error("HTTP " + response.status);

        const b = await response.json();

        abrirModal("Editar Bodega", `
            <input id="bodega-id" type="hidden" value="${id}">

            <label>Nombre</label>
            <input id="nombre" type="text" value="${b.nombre}">

            <label>Ubicación</label>
            <input id="ubicacion" type="text" value="${b.ubicacion}">

            <label>Capacidad</label>
            <input id="capacidad" type="number" value="${b.capacidad}">

            <label>ID Encargado</label>
            <input id="encargadoId" type="number" value="${b.encargadoId ?? ""}">
        `);

        document.getElementById("modal-ok").onclick = actualizarBodega;

    } catch (err) {
        console.error("❌ Error cargando bodega:", err);
    }
}


// ======================================================
// 📌 CREAR BODEGA
// ======================================================

async function crearBodega() {
    const bodega = obtenerDatosFormulario();

    try {
        const response = await fetch("http://localhost:8080/api/admin/bodegas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodega)
        });

        if (!response.ok) throw new Error("HTTP " + response.status);

        cerrarModal();
        cargarBodegas();

    } catch (err) {
        console.error("❌ Error al crear:", err);
    }
}


// ======================================================
// 📌 ACTUALIZAR BODEGA
// ======================================================

async function actualizarBodega() {
    const id = document.getElementById("bodega-id").value;
    const bodega = obtenerDatosFormulario();

    try {
        const response = await fetch(`http://localhost:8080/api/admin/bodegas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodega)
        });

        if (!response.ok) throw new Error("HTTP " + response.status);

        cerrarModal();
        cargarBodegas();

    } catch (err) {
        console.error("❌ Error al actualizar:", err);
    }
}


// ======================================================
// 📌 ELIMINAR BODEGA
// ======================================================

async function eliminarBodega(id) {
    if (!confirm("¿Eliminar esta bodega?")) return;

    try {
        const res = await fetch(`http://localhost:8080/api/admin/bodegas/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        cargarBodegas();
    }
    catch (err) {
        console.error("❌ Error eliminando:", err);
    }
}


// ======================================================
// 📌 UTILIDADES
// ======================================================

function obtenerDatosFormulario() {
    return {
        nombre: document.getElementById("nombre").value,
        ubicacion: document.getElementById("ubicacion").value,
        capacidad: parseInt(document.getElementById("capacidad").value),
        encargadoId: parseInt(document.getElementById("encargadoId").value) || null,
        usuarioId: userData.id
    };
}


// ======================================================
// 📌 MODAL - ABRIR / CERRAR
// ======================================================

function abrirModal(titulo, contenidoHTML) {
    document.getElementById("modal-title").innerText = titulo;
    document.getElementById("modal-body").innerHTML = contenidoHTML;

    document.getElementById("modal").classList.add("show");
}

function cerrarModal() {
    document.getElementById("modal").classList.remove("show");
}

document.getElementById("modal-cancel").addEventListener("click", cerrarModal);


// ======================================================
// 📌 BUSCAR BODEGA
// ======================================================

document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();

    document.querySelectorAll(".bodega-card").forEach(card => {
        card.style.display =
            card.innerText.toLowerCase().includes(query)
                ? "block"
                : "none";
    });
});


// ======================================================
// 🚀 INICIALIZAR AUTOMÁTICO SI ESTA VISTA ESTÁ CARGADA
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("bodegasContainer")) {
        cargarBodegas();
    }
});
