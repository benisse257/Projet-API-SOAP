// =====================================================================
// Navigation - FitTracker
// Construction de la barre de navigation et protection des pages
// =====================================================================

// Génère le HTML complet de la navbar avec mise en page dynamique
function buildNav() {
  const userName = localStorage.getItem('nom') || localStorage.getItem('userName') || '';
  const role = localStorage.getItem('role');
  const currentPage = window.location.pathname;

  // Ajoute la classe 'active' sur le lien correspondant à la page courante
  function activeIf(page) {
    return currentPage.includes(page) ? 'class="active"' : '';
  }

  // Affiche le lien admin uniquement pour les administrateurs
  const adminLink = role === 'admin'
    ? `<a href="admin-dashboard.html" ${activeIf('admin-dashboard')}>⚙️ Admin</a>`
    : '';

  return `
    <nav class="navbar">
      <div class="nav-logo">💪 FitTracker</div>
      <div class="nav-links">
        <a href="dashboard.html" ${activeIf('dashboard')}>🏠 Dashboard</a>
        <a href="exercices.html" ${activeIf('exercices')}>🏋️ Exercices</a>
        <a href="seances.html" ${activeIf('seances')}>📋 Séances</a>
        <a href="objectifs.html" ${activeIf('objectifs')}>🎯 Objectifs</a>
        <a href="historique.html" ${activeIf('historique')}>📅 Historique</a>
        ${adminLink}
      </div>
      <div class="nav-user">
        <span>👤 ${userName}</span>
        <button onclick="logout()">Déconnexion</button>
      </div>
    </nav>
  `;
}

// Vide le stockage local et redirige vers la page de connexion
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// Protège l'accès à une page : redirige si non authentifié ou si non admin
function protegerPage(adminOnly = false) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  if (adminOnly) {
    const role = localStorage.getItem('role');
    if (role !== 'admin') window.location.href = 'dashboard.html';
  }
}

// Insère la navbar construite dans le conteneur dédié du DOM
function injectNavbar() {
  const navContainer = document.getElementById('navbar');
  if (navContainer) navContainer.innerHTML = buildNav();
}

document.addEventListener('DOMContentLoaded', () => {
  injectNavbar();
});
