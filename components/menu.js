export function renderSidebarMenu(targetSelector = 'body') {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  
  const isAdmin = userData?.rol === 'ADMIN';

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
      <li class="menu-item ${userData?.rol !== 'ADMIN' ? 'hidden' : ''}" data-target="usuarios"><i>👥</i> Gestión de Usuarios</li>
    </ul>
  </div>

  <header class="app-header">
    <div class="header-left">
      <div class="header-title" id="current-section-title">Dashboard</div>
    </div>
    <div class="header-right">
      <div class="user-dropdown">
        <div class="user-info" id="user-dropdown-trigger">
          <div class="user-avatar">
            ${userData?.nombre ? userData.nombre.charAt(0).toUpperCase() : 'U'}
          </div>
          <div class="user-details">
            <div class="user-name">${userData?.username || 'Usuario'}</div>
            <div class="user-role">${userData?.rol || 'Rol no definido'}</div>
          </div>
          <i>▼</i>
        </div>
        <div class="dropdown-menu" id="user-dropdown-menu">
          <div class="dropdown-divider"></div>
          <button class="dropdown-item logout" onclick="cerrarSesion()">
            <i>🚪</i> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  </header>
  `;
  
  const container = document.querySelector(targetSelector);
  if (container) container.insertAdjacentHTML('afterbegin', html);

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      cargarSeccion(target);
    });
  });

  setupUserDropdown();
}

function setupUserDropdown() {
  const trigger = document.getElementById('user-dropdown-trigger');
  const menu = document.getElementById('user-dropdown-menu');

  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });
  }
}

window.cerrarSesion = function() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("token");
    
    window.location.href = '/pages/login.html'; 
  }
};

async function cargarSeccion(target) {

  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const isAdmin = userData?.rol === "ADMIN";
  
  // Verificar permisos antes de cargar la sección
  if (target === 'usuarios' && !isAdmin) {
    alert('No tienes permisos para acceder a la gestión de usuarios');
    return;
  }

  const main = document.getElementById('main-content');
  const secciones = {
    mover: { 
      html: '/pages/mover.html',
      js: '/js/mover.js',
      title: 'Mover Inventario'
    },
    dashboard: { 
      html: '/pages/dashboard.html',
      js: '/js/dashboard.js',
      title: 'Dashboard'
    },
    bodegas: { 
      html: '/pages/bodega.html',
      js: '/js/bodega.js',
      title: 'Gestión de Bodegas'
    },
    productos: { 
      html: '/pages/inventario.html',
      js: '/js/inventario.js',
      title: 'Inventario'
    },
    usuarios: { 
      html: '/pages/usuarios.html',
      js: '/js/usuarios.js',
      title: 'Gestión de Usuarios'
    }
  };

  const seccion = secciones[target];
  if (!seccion) return;

  try {
    main.innerHTML = '<div class="loading">Cargando...</div>';

    const titleElement = document.getElementById('current-section-title');
    if (titleElement) {
      titleElement.textContent = seccion.title;
    }

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