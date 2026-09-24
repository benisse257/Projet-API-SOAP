// FitTracker — Gestion des programmes d'entraînement
// Permet la création, modification, suppression et consultation des programmes (CRUD)

verifierAuth();
afficherNom();

let toutesLesSeances = [];

/* ===== Initialisation ===== */

// Afficher/masquer les éléments de navigation selon le rôle utilisateur
document.addEventListener('DOMContentLoaded', () => {
  const isAdm = getRole() === 'admin';
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !isAdm; });
  document.querySelectorAll('.nav-sportif').forEach(el => { el.hidden = isAdm; });
});

/* ===== Chargement et affichage des programmes ===== */

// Récupère la liste des programmes depuis l'API et génère les cartes dans le DOM
async function chargerProgrammes() {
  const rep = await appelAPI('/programmes');
  const programmes = rep && rep.success ? rep.data : (rep || []);
  const conteneur = document.getElementById('liste-programmes');
  conteneur.innerHTML = '';

  if (!programmes.length) {
    conteneur.innerHTML = '<p style="color:var(--text-muted,#94a3b8);text-align:center;padding:2rem">Aucun programme. Créez-en un !</p>';
    return;
  }

  programmes.forEach(p => {
    const seances = (p.seances_ids || []);
    const nbSeances = seances.length;
    // Calculer la durée totale du programme en additionnant les durées des séances
    const dureeTotal = seances.reduce((sum, s) => sum + (s.dureeEstimee || 0), 0);
    const dateDebut = p.dateDebut ? formatDate(p.dateDebut) : '-';
    const dateFin = p.dateFin ? formatDate(p.dateFin) : '-';
    // Limiter l'affichage des badges séances à 4 maximum
    const seanceBadges = seances.slice(0, 4).map(s =>
      `<span style="display:inline-block;background:rgba(99,102,241,0.15);color:#818cf8;padding:0.15rem 0.5rem;border-radius:9999px;font-size:0.75rem;margin:0.15rem 0.25rem 0.15rem 0">${s.nom}</span>`
    ).join('');
    // Afficher un compteur supplémentaire si plus de 4 séances
    const extra = nbSeances > 4 ? `<span style="font-size:0.75rem;color:var(--text-muted,#94a3b8);margin-left:0.25rem">+${nbSeances - 4}</span>` : '';

    conteneur.innerHTML += `
      <div class="objectif-carte">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <strong style="font-size:1.05rem">${p.nom}</strong>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-bleu" onclick="ouvrirModal('${p._id}')">✏️</button>
            <button class="btn btn-rouge" onclick="supprimerProgramme('${p._id}')">🗑</button>
          </div>
        </div>
        <div style="margin:0.4rem 0;font-size:0.85rem;color:var(--text-muted,#94a3b8)">
          ${p.description || 'Aucune description'}
        </div>
        <div style="display:flex;gap:1.5rem;margin:0.4rem 0;font-size:0.85rem;color:var(--text-muted,#94a3b8)">
          <span>📅 ${dateDebut} → ${dateFin}</span>
          <span>🏋️ ${nbSeances} séance${nbSeances > 1 ? 's' : ''}</span>
          <span>⏱️ ${dureeTotal} min</span>
        </div>
        <div style="margin-top:0.35rem">${seanceBadges}${extra}</div>
      </div>`;
  });
}

/* ===== Gestion des séances disponibles ===== */

// Charge la liste de toutes les séances depuis l'API pour les associer aux programmes
async function chargerSeancesDisponibles() {
  const seances = await appelAPI('/seances');
  toutesLesSeances = Array.isArray(seances) ? seances : (seances || []);
}

// Remplit le champ select avec les séances disponibles et pré-sélectionne celles déjà associées
function peuplerSelectSeances(selectedIds = []) {
  const select = document.getElementById('progSeances');
  select.innerHTML = '';
  toutesLesSeances.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s._id;
    opt.textContent = `${s.nom} (${s.dureeEstimee || '?'} min)`;
    if (selectedIds.includes(s._id)) opt.selected = true;
    select.appendChild(opt);
  });
}

/* ===== Modale de création/édition ===== */

// Ouvre la modale en mode création ou édition selon la présence d'un identifiant
async function ouvrirModal(id = '') {
  document.getElementById('progId').value = id;
  document.getElementById('modalTitre').textContent = id ? 'Modifier le programme' : 'Nouveau programme';

  if (!toutesLesSeances.length) {
    await chargerSeancesDisponibles();
  }

  if (id) {
    // Mode édition : charger les données du programme existant
    const rep = await appelAPI(`/programmes/${id}`);
    const p = rep && rep.success ? rep.data : null;
    if (p) {
      document.getElementById('progNom').value = p.nom || '';
      document.getElementById('progDesc').value = p.description || '';
      document.getElementById('progDateDebut').value = p.dateDebut ? p.dateDebut.slice(0, 10) : '';
      document.getElementById('progDateFin').value = p.dateFin ? p.dateFin.slice(0, 10) : '';
      // Extraire les IDs des séances (peuvent être des objets ou des chaînes)
      const seanceIds = (p.seances_ids || []).map(s => typeof s === 'string' ? s : s._id);
      peuplerSelectSeances(seanceIds);
    } else {
      peuplerSelectSeances([]);
    }
  } else {
    // Mode création : réinitialiser tous les champs
    document.getElementById('progNom').value = '';
    document.getElementById('progDesc').value = '';
    document.getElementById('progDateDebut').value = '';
    document.getElementById('progDateFin').value = '';
    peuplerSelectSeances([]);
  }

  document.getElementById('modal').classList.add('actif');
}

function fermerModal() {
  document.getElementById('modal').classList.remove('actif');
}

/* ===== Opérations CRUD ===== */

// Sauvegarde un nouveau programme ou met à jour un programme existant
async function sauvegarderProgramme() {
  const id = document.getElementById('progId').value;
  const select = document.getElementById('progSeances');
  const seancesIds = Array.from(select.selectedOptions).map(o => o.value);

  const corps = {
    nom: document.getElementById('progNom').value.trim(),
    description: document.getElementById('progDesc').value.trim(),
    dateDebut: document.getElementById('progDateDebut').value || null,
    dateFin: document.getElementById('progDateFin').value || null,
    seances_ids: seancesIds
  };

  if (!corps.nom) { alert('Le nom du programme est obligatoire.'); return; }
  if (!seancesIds.length) { alert('Sélectionnez au moins une séance.'); return; }

  // Appel API adapté selon création ou mise à jour
  if (id) {
    await appelAPI(`/programmes/${id}`, 'PUT', corps);
  } else {
    await appelAPI('/programmes', 'POST', corps);
  }
  fermerModal();
  chargerProgrammes();
}

// Supprime un programme après confirmation de l'utilisateur
async function supprimerProgramme(id) {
  if (!confirm('Supprimer ce programme ?')) return;
  await appelAPI(`/programmes/${id}`, 'DELETE');
  chargerProgrammes();
}

/* ===== Point d'entrée ===== */

// Chargement initial des séances disponibles puis des programmes
(async () => {
  await chargerSeancesDisponibles();
  chargerProgrammes();
})();
