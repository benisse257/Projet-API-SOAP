// FitTracker — Historique des séances d'entraînement
// Affiche l'historique des entraînements réalisés avec filtrage par date

verifierAuth();
afficherNom();

/* ===== Initialisation ===== */

// Configurer la navigation selon le rôle et initialiser les écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
  const isAdm = getRole() === 'admin';
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !isAdm; });
  document.querySelectorAll('.nav-sportif').forEach(el => { el.hidden = isAdm; });
  chargerHistorique();

  const formFiltreHistorique = document.getElementById('form-filtre-historique');
  if (formFiltreHistorique) {
    // Recharger l'historique à la soumission du formulaire de filtrage
    formFiltreHistorique.addEventListener('submit', (e) => {
      e.preventDefault();
      chargerHistorique();
    });
  }
});

/* ===== Chargement de l'historique ===== */

// Récupère les entrées d'historique depuis l'API avec les filtres de date optionnels
async function chargerHistorique() {
  const conteneur = document.getElementById('liste-historique');
  conteneur.innerHTML = '<p>Chargement...</p>';

  // Construire les paramètres de requête uniquement pour les dates renseignées
  const dateDebut = document.getElementById('filtre-date-debut')?.value;
  const dateFin = document.getElementById('filtre-date-fin')?.value;

  const params = new URLSearchParams();
  if (dateDebut) params.set('dateDebut', dateDebut);
  if (dateFin) params.set('dateFin', dateFin);

  try {
    const reponse = await fetchAPI(`/historique?${params.toString()}`);
    const entrees = Array.isArray(reponse) ? reponse : (reponse.data || []);
    afficherHistorique(entrees);
  } catch (err) {
    conteneur.innerHTML = `<p class="erreur">${err.message}</p>`;
  }
}

/* ===== Affichage de l'historique ===== */

// Génère les cartes de l'historique pour chaque séance réalisée
function afficherHistorique(entrees) {
  const conteneur = document.getElementById('liste-historique');
  conteneur.innerHTML = '';

  if (!entrees || entrees.length === 0) {
    conteneur.innerHTML = '<p>Aucune séance réalisée sur cette période.</p>';
    return;
  }

  entrees.forEach((entree) => {
    const carte = document.createElement('div');
    carte.className = 'carte-historique';
    carte.innerHTML = `
      <h3>${formatDate(entree.dateRealisation)}</h3>
      <p>Séance : <strong>${entree.seance_id?.nom || '—'}</strong></p>
      <p>Durée : ${entree.dureeTotale || 0} min — Calories : ${entree.caloriesEstimees || 0}</p>
      <p>${(entree.exercicesRealises || []).length} exercice(s) réalisé(s)</p>
      ${entree.commentaire ? `<p><em>« ${entree.commentaire} »</em></p>` : ''}
    `;
    conteneur.appendChild(carte);
  });
}
