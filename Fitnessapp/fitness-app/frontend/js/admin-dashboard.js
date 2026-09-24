/**
 * admin-dashboard.js — Tableau de bord administrateur
 * Gère l'affichage des statistiques globales, de la liste des utilisateurs,
 * des objectifs en cours, de l'historique des séances et du graphique top exercices.
 */

verifierAuth();
afficherNom();

/* ===== INITIALISATION ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Rendre visible la navigation admin pour les utilisateurs avec le rôle admin
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = false; });
  chargerDashboardAdmin();
});

/* ===== UTILITAIRES DE DONNÉES ===== */

/**
 * Normalise la réponse de l'API en un tableau exploitable.
 * Gère les formats { success, data }, les tableaux bruts, et les objets imbriqués.
 */
function parseData(rep) {
  if (!rep) return null;
  if (rep.success !== undefined) return rep.success ? (rep.data ?? []) : [];
  if (Array.isArray(rep)) return rep;
  return rep.data ?? rep;
}

/* ===== CHARGEMENT DU TABLEAU DE BORD ===== */
async function chargerDashboardAdmin() {
  // Requêtes API parallèles pour récupérer toutes les données nécessaires
  const [statsRep, objectifsRep, historiqueRep, usersRep] = await Promise.all([
    appelAPI('/stats/global').catch(() => null),
    appelAPI('/objectifs').catch(() => null),
    appelAPI('/historique').catch(() => null),
    appelAPI('/users').catch(() => null)
  ]);

  const stats = parseData(statsRep) || null;
  const objs = parseData(objectifsRep) || [];
  const hist = parseData(historiqueRep) || [];
  const users = parseData(usersRep) || [];

  if (stats) renderResumeStatsAdmin(stats);
  renderDerniersUsers(users);
  renderObjectifs(objs);
  renderHistoriqueTable(hist);

  // Afficher le graphique top exercices si des données sont disponibles
  if (stats) {
    const topExos = stats.exercicesLesPlusUtilises || [];
    if (topExos.length > 0) renderChartTopExercices(topExos);
    else showEmptyChart();
  }
}

/* ===== RENDU DU RÉSUMÉ ADMIN ===== */

/** Affiche les statistiques globales et les compteurs dans le panneau résumé. */
function renderResumeStatsAdmin(stats) {
  const el = document.getElementById('resume-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="resume-item">
      <span class="resume-label">Utilisateurs inscrits</span>
      <span class="resume-value">${stats.totalUtilisateurs ?? 0}</span>
    </div>
    <div class="resume-item">
      <span class="resume-label">Séances enregistrées</span>
      <span class="resume-value">${stats.totalSeances ?? 0}</span>
    </div>
  `;

  set('statTotalUsers', stats.totalUtilisateurs ?? 0);
  set('statTotalSeances', stats.totalSeances ?? 0);
  set('statTotalExercices', stats.totalExercices ?? 0);
  set('statTotalCategories', stats.totalCategories ?? 0);
  set('statTotalProgrammes', stats.totalProgrammes ?? 0);
  set('statTotalObjectifs', stats.totalObjectifs ?? 0);
}

/* ===== RENDU DE LA LISTE UTILISATEURS ===== */
function renderDerniersUsers(users) {
  const tbody = document.getElementById('derniersUsers');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Aucun utilisateur.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map((u, i) => {
    const roleClass = u.role === 'admin' ? 'role-admin' : 'role-user';
    const statutClass = u.actif ? 'statut-actif' : 'statut-inactif';
    return `
      <tr>
        <td style="color:var(--text-muted);font-size:0.85rem">${i + 1}</td>
        <td><strong>${u.nom}</strong></td>
        <td>${u.email}</td>
        <td><span class="${roleClass}">${u.role === 'admin' ? 'Admin' : 'Sportif'}</span></td>
        <td><span class="${statutClass}">${u.actif ? 'Actif' : 'Désactivé'}</span></td>
      </tr>`;
  }).join('');
}

/* ===== RENDU DES OBJECTIFS ===== */
function renderObjectifs(objs) {
  const cont = document.getElementById('objectifsContainer');
  if (!cont) return;

  // Filtrer uniquement les objectifs en cours de progression
  const enCours = objs.filter(o => o.statut === 'en_cours');

  if (enCours.length === 0) {
    cont.innerHTML = '<p style="color:var(--text-muted);padding:1rem 0">Aucun objectif en cours.</p>';
    return;
  }

  cont.innerHTML = enCours.slice(0, 4).map(o => {
    const pct = o.progression || 0;
    // Couleur dynamique selon le niveau de progression
    const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#3b82f6';
    return `
      <div class="objectif-carte">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${o.titre}</strong>
          <span style="color:var(--text-muted);font-size:0.85rem">${o.valeurActuelle} / ${o.valeurCible}</span>
        </div>
        <div class="barre-prog"><div class="barre-prog-fill" style="width:${Math.min(100, pct)}%;background:${color}"></div></div>
        <small style="color:var(--text-muted)">${pct}% atteint</small>
      </div>`;
  }).join('');
}

/* ===== RENDU DE L'HISTORIQUE ===== */
function renderHistoriqueTable(hist) {
  const tbody = document.getElementById('dernierEntrainement');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (hist.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">Aucun entraînement.</td></tr>';
    return;
  }

  // Afficher les 5 dernières séances uniquement
  tbody.innerHTML = hist.slice(0, 5).map(h => `
    <tr>
      <td>${formatDate(h.dateRealisation)}</td>
      <td>${h.seance_id?.nom || '-'}</td>
      <td>${h.dureeTotale || 0} min</td>
      <td>${h.caloriesEstimees || 0} kcal</td>
    </tr>
  `).join('');
}

/* ===== GRAPHIQUE TOP EXERCICES ===== */

/** Graphique en barres horizontales : classement des exercices les plus utilisés. */
function renderChartTopExercices(donnees) {
  const ctx = document.getElementById('section-chart-top')?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: donnees.map(d => d.nom),
      datasets: [{
        label: "Utilisations",
        data: donnees.map(d => d.total),
        backgroundColor: [
          'rgba(99, 102, 241, 0.75)',
          'rgba(168, 85, 247, 0.75)',
          'rgba(59, 130, 246, 0.75)',
          'rgba(14, 165, 233, 0.75)',
          'rgba(20, 184, 166, 0.75)'
        ],
        borderColor: ['#6366f1', '#a855f7', '#3b82f6', '#0ea5e9', '#14b8a6'],
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Top exercices les plus utilisés', color: '#e2e8f0', font: { size: 14, weight: '600' } }
      },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
        y: { ticks: { color: '#e2e8f0' }, grid: { display: false } }
      }
    }
  });
}

/* ===== AFFICHAGE VIDE ===== */

/** Remplace le conteneur du graphique par un message d'absence de données. */
function showEmptyChart() {
  const container = document.getElementById('section-chart-top')?.closest('.graphique-container');
  if (container) container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2.5rem">Aucune donnée d\'exercices.</p>';
}

/* ===== UTILS ===== */
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
