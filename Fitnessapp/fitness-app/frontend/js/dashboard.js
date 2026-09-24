/**
 * dashboard.js — Tableau de bord utilisateur (sportif)
 * Gère l'affichage des statistiques personnelles, des graphiques de progression
 * (hebdomadaire et mensuelle), des objectifs en cours et de l'historique des séances.
 */

verifierAuth();
afficherNom();

let chartSemaine = null;
let chartMois = null;

/* ===== INITIALISATION ===== */
document.addEventListener('DOMContentLoaded', () => {
  const isAdm = getRole() === 'admin';

  // Afficher ou masquer les liens de navigation admin selon le rôle
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !isAdm; });

  if (isAdm) {
    // Masquer les sections propres au sportif lorsqu'un admin accède au dashboard
    document.getElementById('section-chart-semaine')?.closest('.graphique-container')?.remove();
    document.getElementById('section-chart-mois')?.closest('.graphique-container')?.remove();
    document.getElementById('section-objectifs')?.remove();
    document.getElementById('section-entrainements')?.remove();
    document.querySelectorAll('.stats-row-2 .stats-col').forEach(el => {
      if (el.closest && !el.querySelector('#section-objectifs') && !el.querySelector('#section-entrainements')) el.remove();
    });
    chargerDashboardAdmin();
  } else {
    // Supprimer le graphique top exercices (réservé à l'admin)
    document.getElementById('section-chart-top')?.closest('.graphique-container')?.remove();
    chargerDashboardSportif();
  }
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

/**
 * Calcule le pourcentage de variation entre deux valeurs.
 */
function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/** Génère un badge HTML de comparaison semaine (hausse/baisse/constant). */
function compBadge(current, previous, unit) {
  if (current === 0 && previous === 0) return '<span class="comp-none">—</span>';
  const pct = pctChange(current, previous);
  if (pct > 0) return `<span class="comp-up">↑ +${pct}% vs semaine dern.</span>`;
  if (pct < 0) return `<span class="comp-down">↓ ${pct}% vs semaine dern.</span>`;
  return '<span class="comp-equal">= même</span>';
}

/** Génère un badge HTML de comparaison mois (hausse/baisse/constant). */
function compBadgeMois(current, previous) {
  if (current === 0 && previous === 0) return '<span class="comp-none">—</span>';
  const pct = pctChange(current, previous);
  if (pct > 0) return `<span class="comp-up">↑ +${pct}% vs mois dern.</span>`;
  if (pct < 0) return `<span class="comp-down">↓ ${pct}% vs mois dern.</span>`;
  return '<span class="comp-equal">= même</span>';
}

/* ===== CHARGEMENT DU TABLEAU DE BORD SPORTIF ===== */
async function chargerDashboardSportif() {
  // Appels API parallèles pour récupérer historique, objectifs et statistiques
  const [historiqueRep, objectifsRep, statsRep] = await Promise.all([
    appelAPI('/historique').catch(() => null),
    appelAPI('/objectifs').catch(() => null),
    appelAPI('/stats/me').catch(() => null)
  ]);

  const hist = parseData(historiqueRep) || [];
  const objs = parseData(objectifsRep) || [];
  const stats = parseData(statsRep) || null;

  // Préférer les stats pré-calculées si disponibles, sinon calculer depuis l'historique
  if (stats) {
    renderResumeStats(stats);
    renderStatsFromStats(stats);
  } else {
    renderStatsFromHistorique(hist, objs);
  }

  renderObjectifs(objs);
  renderHistoriqueTable(hist);

  // Afficher les graphiques de progression si des données existent
  if (stats) {
    const semaines = stats.progressionParSemaine || [];
    const mois = stats.progressionParMois || [];
    if (semaines.length > 0) renderChartSemaine(semaines);
    else showEmptyChart('section-chart-semaine', 'Aucune donnée hebdomadaire');
    if (mois.length > 0) renderChartMois(mois);
    else showEmptyChart('section-chart-mois', 'Aucune donnée mensuelle');
  } else {
    showEmptyChart('section-chart-semaine', 'Statistiques non disponibles');
    showEmptyChart('section-chart-mois', '');
  }
}

/* ===== RENDU DES STATISTIQUES ===== */

/** Affiche les statistiques à partir des données pré-calculées par l'API. */
function renderStatsFromStats(stats) {
  const sem = stats.semaine || {};
  const mo = stats.mois || {};

  set('statSeances', sem.seances ?? 0);
  set('statCalories', sem.calories ?? 0);
  set('statDuree', sem.duree ?? 0);
  set('statSeancesMonth', mo.seances ?? 0);
  set('statCaloriesMonth', mo.calories ?? 0);
  set('statDureeMonth', mo.duree ?? 0);

  // Badges de comparaison avec la semaine précédente
  const compSem = document.getElementById('compSemaine');
  if (compSem) {
    compSem.innerHTML = `
      <span class="comp-item">${compBadge(sem.seances, sem.prevSeances)}</span>
      <span class="comp-item">${compBadge(sem.calories, sem.prevCalories)}</span>
      <span class="comp-item">${compBadge(sem.duree, sem.prevDuree)}</span>
    `;
  }

  // Badges de comparaison avec le mois précédent
  const compMo = document.getElementById('compMois');
  if (compMo) {
    compMo.innerHTML = `
      <span class="comp-item">${compBadgeMois(mo.seances, mo.prevSeances)}</span>
      <span class="comp-item">${compBadgeMois(mo.calories, mo.prevCalories)}</span>
      <span class="comp-item">${compBadgeMois(mo.duree, mo.prevDuree)}</span>
    `;
  }
}

/** Calcule et affiche les stats en filtrant l'historique par semaine et mois en cours. */
function renderStatsFromHistorique(hist, objs) {
  const now = new Date();

  // Calcul du lundi de la semaine en cours
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek = hist.filter(h => new Date(h.dateRealisation) >= startOfWeek);
  const thisMonth = hist.filter(h => new Date(h.dateRealisation) >= startOfMonth);
  const enCours = objs.filter(o => o.statut === 'en_cours');

  set('statSeances', thisWeek.length);
  set('statCalories', Math.round(thisWeek.reduce((s, h) => s + (h.caloriesEstimees || 0), 0)));
  set('statDuree', Math.round(thisWeek.reduce((s, h) => s + (h.dureeTotale || 0), 0)));
  set('statSeancesMonth', thisMonth.length);
  set('statCaloriesMonth', Math.round(thisMonth.reduce((s, h) => s + (h.caloriesEstimees || 0), 0)));
  set('statDureeMonth', Math.round(thisMonth.reduce((s, h) => s + (h.dureeTotale || 0), 0)));
}

/* ===== CHARGEMENT DU TABLEAU DE BORD ADMIN (MODE HYBRIDE) ===== */
async function chargerDashboardAdmin() {
  const [statsRep, objectifsRep, historiqueRep] = await Promise.all([
    appelAPI('/stats/global').catch(() => null),
    appelAPI('/objectifs').catch(() => null),
    appelAPI('/historique').catch(() => null)
  ]);

  const stats = parseData(statsRep) || null;
  const objs = parseData(objectifsRep) || [];
  const hist = parseData(historiqueRep) || [];

  if (stats) {
    renderResumeStatsAdmin(stats);
  }

  renderObjectifs(objs);
  renderHistoriqueTable(hist);
}

/* ===== RENDU DU RÉSUMÉ ===== */

/** Affiche le résumé stats pour un utilisateur sportif (séances + volume). */
function renderResumeStats(stats) {
  const el = document.getElementById('resume-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="resume-item">
      <span class="resume-label">Séances réalisées</span>
      <span class="resume-value">${stats.nombreSeances ?? 0}</span>
    </div>
    <div class="resume-item">
      <span class="resume-label">Volume total soulevé</span>
      <span class="resume-value">${(stats.volumeTotal ?? 0).toLocaleString('fr-FR')} kg</span>
    </div>
  `;
}

/** Affiche le résumé stats pour un administrateur (utilisateurs + séances globales). */
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

/* ===== AFFICHAGE VIDE ===== */

/** Remplace un conteneur de graphique par un message d'absence de données. */
function showEmptyChart(canvasId, message) {
  const container = document.getElementById(canvasId)?.closest('.graphique-container');
  if (container) container.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:2.5rem 1rem">${message}</p>`;
}

/* ===== GRAPHIQUES CHART.JS — MULTI-DATASETS ===== */

/** Graphique en courbes : progression hebdomadaire (séances + calories). */
function renderChartSemaine(donnees) {
  const ctx = document.getElementById('section-chart-semaine')?.getContext('2d');
  if (!ctx) return;
  if (chartSemaine) chartSemaine.destroy();

  chartSemaine = new Chart(ctx, {
    type: 'line',
    data: {
      labels: donnees.map(d => d.semaine),
      datasets: [
        {
          label: 'Séances',
          data: donnees.map(d => d.nombreSeances),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Calories',
          data: donnees.map(d => d.caloriesTotales || 0),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.08)',
          borderWidth: 2,
          borderDash: [5, 3],
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#f97316',
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } }
        },
        title: { display: true, text: 'Progression hebdomadaire', color: '#e2e8f0', font: { size: 14, weight: '600' }, padding: { bottom: 16 } },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#e2e8f0',
          bodyColor: '#e2e8f0',
          cornerRadius: 10,
          padding: 12,
          bodySpacing: 6,
          titleFont: { weight: '600' }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.08)' } },
        y: {
          type: 'linear', position: 'left', beginAtZero: true,
          title: { display: true, text: 'Séances', color: '#6366f1', font: { size: 11 } },
          ticks: { stepSize: 1, color: '#94a3b8' },
          grid: { color: 'rgba(148,163,184,0.08)' }
        },
        y1: {
          type: 'linear', position: 'right', beginAtZero: true,
          title: { display: true, text: 'Calories', color: '#f97316', font: { size: 11 } },
          ticks: { color: '#94a3b8' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

/** Graphique mixte barres/courbes : progression mensuelle (séances + calories). */
function renderChartMois(donnees) {
  const ctx = document.getElementById('section-chart-mois')?.getContext('2d');
  if (!ctx) return;
  if (chartMois) chartMois.destroy();

  chartMois = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: donnees.map(d => d.mois),
      datasets: [
        {
          label: 'Séances',
          data: donnees.map(d => d.nombreSeances),
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderColor: '#6366f1',
          borderWidth: 0,
          borderRadius: 8,
          yAxisID: 'y'
        },
        {
          label: 'Calories',
          data: donnees.map(d => d.caloriesTotales || 0),
          type: 'line',
          borderColor: '#f97316',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointBackgroundColor: '#f97316',
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } }
        },
        title: { display: true, text: 'Progression mensuelle', color: '#e2e8f0', font: { size: 14, weight: '600' }, padding: { bottom: 16 } },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#e2e8f0',
          bodyColor: '#e2e8f0',
          cornerRadius: 10,
          padding: 12,
          bodySpacing: 6
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.08)' } },
        y: {
          type: 'linear', position: 'left', beginAtZero: true,
          title: { display: true, text: 'Séances', color: '#6366f1', font: { size: 11 } },
          ticks: { stepSize: 1, color: '#94a3b8' },
          grid: { color: 'rgba(148,163,184,0.08)' }
        },
        y1: {
          type: 'linear', position: 'right', beginAtZero: true,
          title: { display: true, text: 'Calories', color: '#f97316', font: { size: 11 } },
          ticks: { color: '#94a3b8' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

/* ===== UTILS ===== */
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
