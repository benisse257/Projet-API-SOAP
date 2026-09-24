// ============================================================================
// FitTracker - Gestion des catégories (CRUD)
// Page de listing, création, modification et suppression des catégories
// d'exercices. L'interface d'administration n'est visible que pour les admins.
// ============================================================================

verifierAuth();
afficherNom();

const estAdmin = getRole() === 'admin';

document.addEventListener('DOMContentLoaded', () => {
  // Afficher/masquer les éléments de navigation selon le rôle
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !estAdmin; });
  document.querySelectorAll('.nav-sportif').forEach(el => { el.hidden = estAdmin; });

  // Dévoiler la zone d'administration uniquement pour les administrateurs
  if (estAdmin) {
    document.getElementById('zone-admin-categorie').hidden = false;
  }

  chargerCategories();
});

/* ===== CHARGEMENT ET AFFICHAGE ===== */

async function chargerCategories() {
  try {
    const reponse = await fetchAPI('/categories');
    // Gérer les deux formats possibles de réponse (tableau ou objet avec clé data)
    const categories = Array.isArray(reponse) ? reponse : (reponse.data || []);
    afficherCategories(categories);
  } catch (err) {
    document.getElementById('liste-categories').innerHTML = `<p class="erreur">${err.message}</p>`;
  }
}

function afficherCategories(categories) {
  const conteneur = document.getElementById('liste-categories');
  conteneur.innerHTML = '';

  if (categories.length === 0) {
    conteneur.innerHTML = '<p>Aucune catégorie enregistrée.</p>';
    return;
  }

  categories.forEach((cat) => {
    const carte = document.createElement('div');
    carte.className = 'carte-categorie';
    carte.innerHTML = `
      <h4>${cat.nom}</h4>
      <p>${cat.description || 'Aucune description'}</p>
      ${estAdmin ? `
        <div class="actions">
          <button class="btn btn-bleu" onclick="editCategorie('${cat._id}', '${cat.nom.replace(/'/g, "\\'")}', '${(cat.description || '').replace(/'/g, "\\'")}')">✏️ Modifier</button>
          <button class="btn btn-rouge" onclick="supprimerCategorie('${cat._id}')">🗑 Supprimer</button>
        </div>
      ` : ''}
    `;
    conteneur.appendChild(carte);
  });
}

/* ===== MODAL D'ÉDITION ===== */

function ouvrirModalCategorie() {
  document.getElementById('cat-nom').value = '';
  document.getElementById('cat-description').value = '';
  document.getElementById('titre-modal-categorie').textContent = 'Ajouter une catégorie';
  document.getElementById('modal-categorie').classList.add('actif');
}

function fermerModalCategorie() {
  document.getElementById('modal-categorie').classList.remove('actif');
}

function editCategorie(id, nom, description) {
  document.getElementById('cat-nom').value = nom;
  document.getElementById('cat-description').value = description;
  document.getElementById('titre-modal-categorie').textContent = 'Modifier la catégorie';
  document.getElementById('modal-categorie').classList.add('actif');
  // Stocker l'identifiant dans un attribut data pour le mode édition
  document.getElementById('modal-categorie').dataset.editId = id;
}

/* ===== ENREGISTREMENT ===== */

async function sauvegarderCategorie(event) {
  event.preventDefault();

  const id = document.getElementById('modal-categorie').dataset.editId || '';
  const nom = document.getElementById('cat-nom').value.trim();
  const description = document.getElementById('cat-description').value.trim();

  if (!nom) {
    alert('Le nom est obligatoire');
    return;
  }

  try {
    const body = { nom, description };

    // Appel PUT si modification, sinon POST pour la création
    if (id) {
      await fetchAPI(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    } else {
      await fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }

    fermerModalCategorie();
    // Nettoyer l'attribut data après sauvegarde
    delete document.getElementById('modal-categorie').dataset.editId;
    chargerCategories();
  } catch (err) {
    alert(err.message);
  }
}

/* ===== SUPPRESSION ===== */

async function supprimerCategorie(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

  try {
    await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
    chargerCategories();
  } catch (err) {
    alert(err.message);
  }
}