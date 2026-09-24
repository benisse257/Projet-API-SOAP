// ============================================================================
// FitTracker - Gestion des séances (CRUD)
// Page de listing, création, modification et suppression des séances.
// Permet également de gérer les détails (exercices) de chaque séance
// et de marquer une séance comme réalisée.
// ============================================================================

verifierAuth();
afficherNom();

// Identifiant de la séance actuellement sélectionnée dans le panneau de détails
let seanceActive = null;

/* ===== CHARGEMENT ET AFFICHAGE ===== */

async function chargerSeances() {
  const seances = await appelAPI('/seances');
  const tbody   = document.getElementById('tbodySeances');
  tbody.innerHTML = '';
  (seances || []).forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${s.nom}</strong></td>
        <td style="color:#666;font-size:0.9rem">${s.description || '-'}</td>
        <td>${s.dureeEstimee || '-'} min</td>
        <td>${s.statut ? `<span class="statut-${s.statut}">${s.statut}</span>` : 'planifiee'}</td>
        <td class="actions-cell">
          <button class="btn btn-bleu" onclick="voirDetails('${s._id}','${s.nom.replace(/'/g, "\\'")}')">📋 Détails</button>
          <button class="btn btn-vert" onclick="ajouterExercice('${s._id}','${s.nom.replace(/'/g, "\\'")}')">➕ Exercice</button>
          <button class="btn btn-vert" onclick="ouvrirModalSeance('${s._id}','${s.nom.replace(/'/g, "\\'")}','${(s.description||'').replace(/'/g, "\\'")}',${s.dureeEstimee||0},${s.estPublique})">✏️ Modifier</button>
          <button class="btn btn-success" onclick="marquerCommeRealisee('${s._id}')">✅ Réalisée</button>
          <button class="btn btn-rouge" onclick="supprimerSeance('${s._id}')">🗑</button>
        </td>
      </tr>`;
  });
}

/* ===== MODAL D'ÉDITION ===== */

function ouvrirModalSeance(id='',nom='',desc='',duree=0,pub=false) {
  document.getElementById('seanceId').value       = id;
  document.getElementById('seanceNom').value      = nom;
  document.getElementById('seanceDesc').value     = desc;
  document.getElementById('seanceDuree').value    = duree || '';
  document.getElementById('seancePublique').checked = pub;
  document.getElementById('titreModalSeance').textContent = id ? 'Modifier la séance' : 'Nouvelle séance';
  document.getElementById('modalSeance').classList.add('actif');
}
function fermerModalSeance() { document.getElementById('modalSeance').classList.remove('actif'); }

/* ===== ENREGISTREMENT ===== */

async function sauvegarderSeance() {
  const id    = document.getElementById('seanceId').value;
  const corps = {
    nom:          document.getElementById('seanceNom').value.trim(),
    description:  document.getElementById('seanceDesc').value.trim(),
    dureeEstimee: parseInt(document.getElementById('seanceDuree').value) || 0,
    estPublique:  document.getElementById('seancePublique').checked
  };
  if (!corps.nom) { alert('Le nom est obligatoire'); return; }
  // Appel PUT si modification, sinon POST pour la création
  id ? await appelAPI(`/seances/${id}`, 'PUT', corps) : await appelAPI('/seances', 'POST', corps);
  fermerModalSeance();
  chargerSeances();
}

/* ===== SUPPRESSION ===== */

async function supprimerSeance(id) {
  if (!confirm('Supprimer cette séance ?')) return;
  await appelAPI(`/seances/${id}`, 'DELETE');
  chargerSeances();
}

/* ===== PANNEAU DE DÉTAILS ===== */

async function voirDetails(seanceId, nomSeance) {
  seanceActive = seanceId;
  document.getElementById('titreDetails').textContent = nomSeance;
  document.getElementById('panneauDetails').classList.add('actif');
  // Masquer la zone d'ajout, afficher uniquement la lecture
  document.getElementById('zoneAjouter').style.display = 'none';
  document.getElementById('zoneDetails').style.display = 'block';
  await chargerDetails();
}

async function ajouterExercice(seanceId, nomSeance) {
  seanceActive = seanceId;
  document.getElementById('titreDetails').textContent = nomSeance;
  document.getElementById('panneauDetails').classList.add('actif');
  // Afficher les zones d'ajout et de détails
  document.getElementById('zoneAjouter').style.display = 'block';
  document.getElementById('zoneDetails').style.display = 'block';
  await chargerListeExercices();
  await chargerDetails();
}

/* ===== CHARGEMENT DES EXERCICES DISPONIBLES ===== */

async function chargerListeExercices() {
  const exos = await appelAPI('/exercices');
  const sel  = document.getElementById('selectExercice');
  sel.innerHTML = '';
  if (!exos || exos.length === 0) {
    sel.innerHTML = '<option value="">Aucun exercice disponible</option>';
    return;
  }
  (exos || []).forEach(e => {
    sel.innerHTML += `<option value="${e._id}">${e.nom} (${e.categorie})</option>`;
  });
}

/* ===== CHARGEMENT DES DÉTAILS DE LA SÉANCE ===== */

async function chargerDetails() {
  const details = await appelAPI(`/seances/${seanceActive}/details`);
  const liste   = document.getElementById('listeDetails');
  liste.innerHTML = '';
  if (!details || details.length === 0) {
    liste.innerHTML = '<p style="color:#999;text-align:center;padding:1rem">Aucun exercice. Cliquez sur Ajouter exercice.</p>';
    return;
  }
  details.forEach(d => {
    // Formatage de la mesure : séries x répétitions ou séries x durée en secondes
    const mesure = d.repetitions ? `${d.series}x${d.repetitions} reps` : `${d.series}x${d.dureeSecondes}s`;
    const poids  = d.poidsKg > 0 ? ` — ${d.poidsKg}kg` : ' — poids du corps';
    liste.innerHTML += `
      <div class="detail-item">
        <div class="detail-ordre">${d.ordre}</div>
        <div class="detail-info">
          <strong>${d.exercice?.nom || ''}</strong>
          <small>${mesure}${poids} | Repos: ${d.reposSecondes}s</small>
          ${d.notes ? `<small style="display:block;color:#888;font-style:italic">${d.notes}</small>` : ''}
        </div>
        <button class="btn btn-rouge" onclick="supprimerDetail('${d._id}')">🗑</button>
      </div>`;
  });
}

/* ===== AJOUT D'UN EXERCICE À LA SÉANCE ===== */

async function ajouterDetail() {
  if (!seanceActive) {
    alert('Sélectionnez d\'abord une séance.');
    return;
  }

  const exerciceId = document.getElementById('selectExercice').value;
  if (!exerciceId) {
    alert('Veuillez choisir un exercice valide.');
    return;
  }

  // Collecte des paramètres de l'exercice (séries, répétitions ou durée, poids, repos)
  const corps = {
    exercice:      exerciceId,
    series:        parseInt(document.getElementById('nbSeries').value)  || 3,
    repetitions:   parseInt(document.getElementById('nbReps').value)    || undefined,
    dureeSecondes: parseInt(document.getElementById('dureeSec').value)  || undefined,
    poidsKg:       parseFloat(document.getElementById('poids').value)   || 0,
    reposSecondes: parseInt(document.getElementById('repos').value)     || 60,
    notes:         document.getElementById('notesDetail').value
  };

  try {
    await appelAPI(`/seances/${seanceActive}/details`, 'POST', corps);
    await chargerDetails();
  } catch (err) {
    alert(err.message || 'Impossible d\'ajouter l\'exercice.');
  }
}

/* ===== SUPPRESSION D'UN EXERCICE DE LA SÉANCE ===== */

async function supprimerDetail(detailId) {
  if (!confirm('Retirer cet exercice ?')) return;
  await appelAPI(`/seances/${seanceActive}/details/${detailId}`, 'DELETE');
  await chargerDetails();
}

function fermerDetails() {
  document.getElementById('panneauDetails').classList.remove('actif');
  document.getElementById('zoneAjouter').style.display = 'none';
  seanceActive = null;
}

/* ===== MARQUER COMME RÉALISÉE ===== */

async function marquerCommeRealisee(id) {
  // Collecte des informations de performance via des prompts successifs
  const duree = prompt('Durée réelle (minutes) :', '45');
  if (duree === null) return;
  const calories = prompt('Calories estimées :', '300');
  if (calories === null) return;
  const commentaire = prompt('Commentaire (optionnel) :', '');

  try {
    await appelAPI(`/seances/${id}`, 'PUT', {
      statut: 'realisee',
      dureeTotale: parseInt(duree) || 0,
      caloriesEstimees: parseInt(calories) || 0,
      commentaire: commentaire || ''
    });
    alert('Séance marquée comme réalisée !');
    await chargerSeances();
  } catch (err) {
    alert(err.message);
  }
}

/* ===== INITIALISATION ===== */

document.addEventListener('DOMContentLoaded', () => {
  const isAdm = isAdmin();
  // Afficher/masquer les éléments de navigation selon le rôle
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !isAdm; });
  document.querySelectorAll('.nav-sportif').forEach(el => { el.hidden = isAdm; });
});

chargerSeances();