export function renderSidebarMenu(targetSelector = 'body') {
  const html = `
  <div class="sidebar">
    <div class="logo">
      <h1>LogiTrack S.A.</h1>
      <p>Sistema de Gestión de Bodegas</p>
    </div>
    <ul class="menu">
      <li class="menu-item" data-target="dashboard"><i>📊</i> Dashboard</li>
      <li class="menu-item" data-target="bodegas"><i>🏭</i> Gestión de Bodegas</li>
      <li class="menu-item" data-target="productos"><i>📦</i> Gestión de Productos</li>
      <li class="menu-item" data-target="productos"><i>📦</i> Gestión de Usuarios</li>
      <li class="menu-item" data-target="reportes"><i>📈</i> Reportes</li>
    </ul>
  </div>
  `;
  const container = document.querySelector(targetSelector);
  if (container) {
    container.insertAdjacentHTML('afterbegin', html);
  }
}
