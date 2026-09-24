// FitTracker — Gestion des objectifs sportifs
// Permet la création, modification, suppression et suivi de progression des objectifs (CRUD)

verifierAuth();
afficherNom();

/* ===== Initialisation ===== */

// Afficher/masquer les éléments de navigation selon le rôle utilisateur
document.addEventListener('DOMContentLoaded', () => {
  const isAdm = getRole() === 'admin';
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !isAdm; });
  document.querySelectorAll('.nav-sportif').forEach(el => { el.hidden = isAdm; });
});

/* ===== Chargement et affichage des objectifs ===== */

// Récupère la liste des objectifs depuis l'API et génère les cartes avec barres de progression
async function chargerObjectifs() {
  const objectifs = await appelAPI('/objectifs');
  const liste     = document.getElementById('listeObjectifs');
  liste.innerHTML = '';

  if (!objectifs || objectifs.length === 0) {
    liste.innerHTML = '<p style="color:#999;text-align:center;padding:2rem">Aucun objectif. Créez-en un !</p>';
    return;
  }

  objectifs.forEach(o => {
    const pct = o.progression || 0;
    // Couleur de la barre de progression selon le statut de l'objectif
    const couleur = o.statut === 'atteint' ? '#ffd700' : o.statut === 'abandonné' ? '#adb5bd' : '#52b788';
    liste.innerHTML += `
      <div class="objectif-carte ${o.statut === 'atteint' ? 'atteint' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <strong style="font-size:1.05rem">${o.titre}</strong>
            <span style="margin-left:0.8rem;font-size:0.8rem;color:#666">${o.type.replace('_', ' ')}</span>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-bleu" onclick="ouvrirModal('${o._id}','${o.titre}','${o.type}',${o.valeurCible},${o.valeurActuelle},'${o.dateEcheance ? o.dateEcheance.slice(0,10) : ''}')">✏️</button>
            <button class="btn btn-rouge" onclick="supprimerObjectif('${o._id}')">🗑</button>
          </div>
        </div>
        <div style="margin:0.5rem 0;font-size:0.9rem;color:#555">
          Progression : <strong>${o.valeurActuelle}</strong> / ${o.valeurCible}
          ${o.dateEcheance ? ` — Échéance : ${formatDate(o.dateEcheance)}` : ''}
        </div>
        <div class="barre-prog">
          <!-- Largeur de la barre plafonnée à 100% -->
          <div class="barre-prog-fill" style="width:${Math.min(100, pct)}%;background:${couleur}"></div>
        </div>
        <small style="color:#888">${pct}% — <strong>${o.statut}</strong></small>
      </div>`;
  });
}

/* ===== Modale de création/édition ===== */

// Ouvre la modale avec les valeurs par défaut ou pré-remplies pour l'édition
function ouvrirModal(id='',titre='',type='poids',cible=0,actuelle=0,date='') {
  document.getElementById('objId').value      = id;
  document.getElementById('objTitre').value   = titre;
  document.getElementById('objType').value    = type;
  document.getElementById('objCible').value   = cible || '';
  document.getElementById('objActuelle').value= actuelle || '';
  document.getElementById('objDate').value    = date;
  document.getElementById('modalTitre').textContent = id ? 'Modifier l\'objectif' : 'Nouvel objectif';
  document.getElementById('modal').classList.add('actif');
}
function fermerModal() { document.getElementById('modal').classList.remove('actif'); }

/* ===== Opérations CRUD ===== */

// Sauvegarde un nouvel objectif ou met à jour un objectif existant
async function sauvegarderObjectif() {
  const id    = document.getElementById('objId').value;
  const corps = {
    titre:         document.getElementById('objTitre').value.trim(),
    type:          document.getElementById('objType').value,
    valeurCible:   parseFloat(document.getElementById('objCible').value)   || 0,
    valeurActuelle:parseFloat(document.getElementById('objActuelle').value)|| 0,
    dateEcheance:  document.getElementById('objDate').value || undefined
  };
  if (!corps.titre) { alert('Le titre est obligatoire'); return; }
  // Appel API adapté selon création ou mise à jour
  id ? await appelAPI(`/objectifs/${id}`, 'PUT', corps) : await appelAPI('/objectifs', 'POST', corps);
  fermerModal();
  chargerObjectifs();
}

// Supprime un objectif après confirmation de l'utilisateur
async function supprimerObjectif(id) {
  if (!confirm('Supprimer cet objectif ?')) return;
  await appelAPI(`/objectifs/${id}`, 'DELETE');
  chargerObjectifs();
}

/* ===== Point d'entrée ===== */

// Chargement initial de la liste des objectifs
chargerObjectifs();
