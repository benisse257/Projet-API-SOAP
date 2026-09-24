// =====================================================================
// Statistiques - FitTracker
// Affichage des tableaux de bord et graphiques de progression
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Charge les statistiques adaptées selon le rôle utilisateur
  if (isAdmin()) {
    await chargerStatsGlobales();
  } else {
    await chargerStatsPersonnelles();
  }
});

// Récupère et affiche les statistiques personnelles de l'utilisateur connecté
async function chargerStatsPersonnelles() {
  const resume = document.getElementById('resume-stats');
  try {
    const reponse = await fetchAPI('/stats/me');
    const stats = reponse.data;

    resume.innerHTML = `
      <p>Séances réalisées : <strong>${stats.nombreSeances}</strong></p>
      <p>Volume total soulevé : <strong>${stats.volumeTotal} kg</strong></p>
    `;

    // Affiche les graphiques uniquement si des données de progression existent
    if (stats.progressionParSemaine && stats.progressionParSemaine.length > 0) {
      afficherGraphiqueSeancesParSemaine(stats.progressionParSemaine);
    }
    if (stats.progressionParMois && stats.progressionParMois.length > 0) {
      afficherGraphiqueSeancesParMois(stats.progressionParMois);
    }
  } catch (err) {
    resume.innerHTML = `<p class="erreur">${err.message}</p>`;
  }
}

// Graphique en courbes : nombre de séances réalisées par semaine
function afficherGraphiqueSeancesParSemaine(donnees) {
  const ctx = document.getElementById('graphique')?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: donnees.map((d) => d.semaine),
      datasets: [{
        label: 'Séances par semaine',
        data: donnees.map((d) => d.nombreSeances),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// Graphique en barres : nombre de séances réalisées par mois
function afficherGraphiqueSeancesParMois(donnees) {
  const ctx = document.getElementById('graphique-mois')?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: donnees.map((d) => d.mois),
      datasets: [{
        label: 'Séances par mois',
        data: donnees.map((d) => d.nombreSeances),
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor: '#2563eb',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// Récupère et affiche les statistiques globales (vue administrateur)
async function chargerStatsGlobales() {
  const resume = document.getElementById('resume-stats');
  try {
    const reponse = await fetchAPI('/stats/global');
    const stats = reponse.data;

    resume.innerHTML = `
      <p>Utilisateurs inscrits : <strong>${stats.totalUtilisateurs}</strong></p>
      <p>Séances enregistrées : <strong>${stats.totalSeances}</strong></p>
    `;

    // Affiche le graphique des exercices les plus populaires si disponible
    if (stats.exercicesLesPlusUtilises && stats.exercicesLesPlusUtilises.length > 0) {
      afficherGraphiqueTopExercices(stats.exercicesLesPlusUtilises);
    }
  } catch (err) {
    resume.innerHTML = `<p class="erreur">${err.message}</p>`;
  }
}

// Graphique en barres horizontales : top des exercices les plus utilisés
function afficherGraphiqueTopExercices(donnees) {
  const ctx = document.getElementById('graphique-top-exercices')?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: donnees.map((d) => d.nom),
      datasets: [{
        label: "Nombre d'utilisations",
        data: donnees.map((d) => d.total),
        backgroundColor: 'rgba(22, 163, 74, 0.7)',
        borderColor: '#16a34a',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}
