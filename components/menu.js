export function renderSidebarMenu(targetSelector = 'body') {
  const html = `
  <div class="sidebar">
    <div class="logo">
      <h1>LogiTrack S.A.</h1>
      <p>Sistema de Gestión de Bodegas</p>
    </div>
    <ul class="menu">
      <li class="menu-item" data-target="mover"><i>📊</i> Mover</li>
      <li class="menu-item" data-target="dashboard"><i>📊</i> Dashboard</li>
      <li class="menu-item" data-target="bodegas"><i>🏭</i> Gestión de Bodegas</li>
      <li class="menu-item" data-target="productos"><i>📦</i> Inventario</li>
      <li class="menu-item" data-target="usuarios"><i>👤</i> Gestión de Usuarios</li>
      <li class="menu-item" data-target="reportes"><i>📈</i> Reportes</li>
    </ul>
  </div>
  `;
  const container = document.querySelector(targetSelector);
  if (container) container.insertAdjacentHTML('afterbegin', html);

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      cargarSeccion(target);
    });
  });
}

async function cargarSeccion(target) {
  const main = document.getElementById('main-content');
  const secciones = {
    mover: { 
      html: '/pages/mover.html',
      js: '/js/mover.js'
    },
    dashboard: { 
      html: '/pages/dashboard.html',
      js: '/js/dashboard.js'
    },
    bodegas: { 
      html: '/pages/bodega.html',
      js: '/js/bodega.js'
    },
    productos: { 
      html: '/pages/inventario.html',
      js: '/js/inventario.js'
    },
    usuarios: { 
      html: '/pages/usuarios.html',
      js: '/js/usuarios.js'
    },
    reportes: { 
      html: '/pages/reportes.html',
      js: '/js/reportes.js'
    }
  };

  const seccion = secciones[target];
  if (!seccion) return;

  try {
    main.innerHTML = '<div class="loading">Cargando...</div>';

    const res = await fetch(seccion.html);
    const html = await res.text();
    main.innerHTML = html;

    if (seccion.js) {
      await cargarJavaScript(seccion.js, target);
    }

    actualizarMenuActivo(target);

  } catch (err) {
    console.error('❌ Error cargando sección:', err);
    main.innerHTML = `<div class="error">Error al cargar la sección: ${err.message}</div>`;
  }
}

async function cargarJavaScript(jsUrl, seccion) {
  try {
    const module = await import(jsUrl);
    
    const initFunctions = {
      mover: () => module.initMover?.(),
      dashboard: () => module.initDashboard?.(),
      bodegas: () => module.initBodegas?.(),
      productos: () => module.initProductos?.(),
      usuarios: () => module.initUsuarios?.(),
      reportes: () => module.initReportes?.()
    };

    const initFunction = initFunctions[seccion];
    if (initFunction) {
      initFunction();
    } else if (module.default) {
      module.default();
    }
    
  } catch (err) {
    console.error(`❌ Error cargando módulo ${jsUrl}:`, err);
  }
}

function actualizarMenuActivo(seccionActiva) {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.target === seccionActiva) {
      item.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  cargarSeccion('dashboard');
});
