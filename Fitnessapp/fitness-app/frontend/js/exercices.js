// ============================================================================
// FitTracker - Gestion des exercices (CRUD)
// Page de listing, création, modification et suppression des exercices.
// Seul l'administrateur peut ajouter, modifier ou supprimer des exercices.
// ============================================================================

verifierAuth();
afficherNom();

/* ===== CHARGEMENT ET AFFICHAGE ===== */

async function chargerExercices() {
  const recherche = document.getElementById('recherche').value;
  const cat       = document.getElementById('filtreCat').value;
  const niv       = document.getElementById('filtreNiv').value;

  // Construction dynamique de l'URL avec les paramètres de filtrage
  let url = '/exercices?';
  if (recherche) url += `recherche=${recherche}&`;
  if (cat)       url += `categorie=${cat}&`;
  if (niv)       url += `niveau=${niv}&`;

  const exercices = await appelAPI(url);
  const tbody     = document.getElementById('tbodyExercices');
  tbody.innerHTML = '';

  if (!exercices || exercices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">Aucun exercice trouvé</td></tr>';
    return;
  }

  // Les boutons d'action ne sont visibles que pour les administrateurs
  const estAdmin = getRole() === 'admin';
  exercices.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${e.nom}</strong></td>
        <td>${badgeCategorie(e.categorie)}</td>
        <td>${badgeNiveau(e.niveauDifficulte)}</td>
        <td style="font-size:0.85rem;color:#666">${(e.muscles || []).join(', ') || '-'}</td>
        <td>
          ${estAdmin ? `<button class="btn btn-bleu" onclick="modifierExercice('${e._id}','${e.nom}','${e.description||''}','${e.categorie}','${e.niveauDifficulte}','${(e.muscles||[]).join(',')}')">✏️</button>` : ''}
          ${estAdmin ? `<button class="btn btn-rouge" onclick="supprimerExercice('${e._id}')">🗑</button>` : ''}
        </td>
      </tr>`;
  });
}

/* ===== MODAL D'ÉDITION ===== */

function ouvrirModal(id = '', nom = '', desc = '', cat = 'musculation', niv = 'debutant', muscles = '') {
  if (getRole() !== 'admin') {
    alert('Accès refusé : seul l\'administrateur peut ajouter ou modifier des exercices.');
    return;
  }
  // Pré-remplir les champs du formulaire avec les valeurs existantes (ou par défaut)
  document.getElementById('exoId').value      = id;
  document.getElementById('exoNom').value     = nom;
  document.getElementById('exoDesc').value    = desc;
  document.getElementById('exoCat').value     = cat;
  document.getElementById('exoNiv').value     = niv;
  document.getElementById('exoMuscles').value = muscles;
  document.getElementById('modalTitre').textContent = id ? 'Modifier l\'exercice' : 'Ajouter un exercice';
  document.getElementById('modal').classList.add('actif');
}

function fermerModal() {
  document.getElementById('modal').classList.remove('actif');
}

function modifierExercice(id, nom, desc, cat, niv, muscles) {
  ouvrirModal(id, nom, desc, cat, niv, muscles);
}

/* ===== ENREGISTREMENT ===== */

async function sauvegarderExercice() {
  const id   = document.getElementById('exoId').value;
  const corps = {
    nom:              document.getElementById('exoNom').value.trim(),
    description:      document.getElementById('exoDesc').value.trim(),
    categorie:        document.getElementById('exoCat').value,
    niveauDifficulte: document.getElementById('exoNiv').value,
    muscles:          document.getElementById('exoMuscles').value.split(',').map(m => m.trim()).filter(Boolean)
  };
  if (!corps.nom) { alert('Le nom est obligatoire'); return; }
  if (getRole() !== 'admin') {
    alert('Accès refusé : seul l\'administrateur peut enregistrer des exercices.');
    return;
  }

  // Appel PUT si modification, sinon POST pour la création
  if (id) {
    await appelAPI(`/exercices/${id}`, 'PUT', corps);
  } else {
    await appelAPI('/exercices', 'POST', corps);
  }
  fermerModal();
  chargerExercices();
}

/* ===== SUPPRESSION ===== */

async function supprimerExercice(id) {
  if (!confirm('Supprimer cet exercice ?')) return;
  await appelAPI(`/exercices/${id}`, 'DELETE');
  chargerExercices();
}

/* ===== CONTRÔLES D'ACCÈS ===== */

function afficherBoutonAjout() {
  const btnAjouter = document.getElementById('btnAjouterExercice');
  if (btnAjouter && getRole() !== 'admin') {
    btnAjouter.style.display = 'none';
  }
}

/* ===== INITIALISATION ===== */

document.addEventListener('DOMContentLoaded', () => {
  const isAdm = isAdmin();
  // Afficher/masquer les éléments de navigation selon le rôle
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !isAdm; });
  document.querySelectorAll('.nav-sportif').forEach(el => { el.hidden = isAdm; });
});

chargerExercices();
afficherBoutonAjout();