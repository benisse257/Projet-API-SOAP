// FitTracker — Gestion des utilisateurs (administration)
// Permet la consultation, création, modification, activation/désactivation et suppression des comptes

verifierAuth();
afficherNom();

let tousLesUsers = [];

/* ===== Initialisation ===== */

// Restreindre l'accès aux administrateurs et charger la liste des utilisateurs
document.addEventListener('DOMContentLoaded', () => {
  const isAdm = getRole() === 'admin';
  document.querySelectorAll('.nav-admin').forEach(el => { el.hidden = !isAdm; });
  document.querySelectorAll('.nav-sportif').forEach(el => { el.hidden = isAdm; });
  if (!isAdm) { window.location.href = '/dashboard'; return; }
  chargerUtilisateurs();
});

/* ===== Chargement et affichage ===== */

// Récupère la liste des utilisateurs depuis l'API
async function chargerUtilisateurs() {
  try {
    const reponse = await fetchAPI('/users');
    tousLesUsers = Array.isArray(reponse) ? reponse : (reponse.data || []);
    afficherUtilisateurs(tousLesUsers);
  } catch (err) {
    document.getElementById('tbody-users').innerHTML =
      `<tr><td colspan="6" class="erreur">${err.message}</td></tr>`;
  }
}

// Génère les lignes du tableau des utilisateurs avec actions disponibles
function afficherUtilisateurs(utilisateurs) {
  const tbody = document.getElementById('tbody-users');
  tbody.innerHTML = '';

  if (utilisateurs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Aucun utilisateur trouvé.</td></tr>';
    return;
  }

  utilisateurs.forEach((user, index) => {
    const ligne = document.createElement('tr');
    // Diminuer l'opacité pour les comptes désactivés
    if (!user.actif) ligne.style.opacity = '0.5';

    const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
    const statutClass = user.actif ? 'statut-actif' : 'statut-inactif';

    ligne.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${user.nom}</strong></td>
      <td>${user.email}</td>
      <td><span class="${roleClass}">${user.role === 'admin' ? 'Admin' : 'Sportif'}</span></td>
      <td><span class="${statutClass}">${user.actif ? 'Actif' : 'Désactivé'}</span></td>
      <td class="actions-cell">
        <button class="btn btn-bleu" onclick="ouvrirModal('${user._id}')">✏️</button>
        <button class="btn btn-${user.actif ? 'rouge' : 'vert'}" onclick="changerStatut('${user._id}', ${user.actif})">
          ${user.actif ? '✕ Désactiver' : '✓ Réactiver'}
        </button>
        <button class="btn btn-rouge" onclick="supprimerUtilisateur('${user._id}')">🗑</button>
      </td>`;
    tbody.appendChild(ligne);
  });
}

/* ===== Filtrage ===== */

// Filtre les utilisateurs en temps réel selon la recherche par nom ou email
function filtrerUtilisateurs() {
  const q = document.getElementById('rechercheUser').value.toLowerCase().trim();
  if (!q) { afficherUtilisateurs(tousLesUsers); return; }
  const filtre = tousLesUsers.filter(u =>
    u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  afficherUtilisateurs(filtre);
}

/* ===== Modale de création/édition ===== */

// Ouvre la modale en mode création ou édition avec gestion du champ mot de passe
function ouvrirModal(id = '') {
  document.getElementById('userId').value = id;
  document.getElementById('modalTitre').textContent = id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur';
  const labelMDP = document.getElementById('labelMDP');
  const champMDP = document.getElementById('userMdp');

  if (id) {
    // Mode édition : pré-remplir les champs avec les données de l'utilisateur
    const u = tousLesUsers.find(u => u._id === id);
    if (u) {
      document.getElementById('userNom').value = u.nom || '';
      document.getElementById('userEmail').value = u.email || '';
      document.getElementById('userRole').value = u.role || 'sportif';
      document.getElementById('userAge').value = u.age || '';
      document.getElementById('userPoids').value = u.poids || '';
      document.getElementById('userTaille').value = u.taille || '';
      document.getElementById('userObjectif').value = u.objectif_principal || '';
    }
    // Le mot de passe est optionnel en mode édition
    labelMDP.textContent = 'Nouveau mot de passe (laisser vide pour garder)';
    champMDP.value = '';
    champMDP.required = false;
  } else {
    // Mode création : réinitialiser tous les champs
    document.getElementById('userNom').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userMdp').value = '';
    document.getElementById('userRole').value = 'sportif';
    document.getElementById('userAge').value = '';
    document.getElementById('userPoids').value = '';
    document.getElementById('userTaille').value = '';
    document.getElementById('userObjectif').value = '';
    // Le mot de passe est obligatoire en mode création
    labelMDP.textContent = 'Mot de passe *';
    champMDP.required = true;
  }

  document.getElementById('modal').classList.add('actif');
}

function fermerModal() {
  document.getElementById('modal').classList.remove('actif');
}

/* ===== Opérations CRUD ===== */

// Sauvegarde un nouvel utilisateur ou met à jour un utilisateur existant
async function sauvegarderUtilisateur() {
  const id = document.getElementById('userId').value;
  const nom = document.getElementById('userNom').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const mdp = document.getElementById('userMdp').value;
  const role = document.getElementById('userRole').value;
  const age = document.getElementById('userAge').value;
  const poids = document.getElementById('userPoids').value;
  const taille = document.getElementById('userTaille').value;
  const objectif = document.getElementById('userObjectif').value.trim();

  if (!nom || !email) { alert('Nom et email sont obligatoires.'); return; }
  if (!id && !mdp) { alert('Le mot de passe est obligatoire pour un nouvel utilisateur.'); return; }
  if (mdp && mdp.length < 6) { alert('Le mot de passe doit faire au moins 6 caractères.'); return; }

  // Construire le corps de la requête en n'ajoutant que les champs renseignés
  const corps = { nom, email, role };
  if (age) corps.age = parseInt(age);
  if (poids) corps.poids = parseFloat(poids);
  if (taille) corps.taille = parseFloat(taille);
  if (objectif) corps.objectif_principal = objectif;
  if (mdp) corps.motDePasse = mdp;

  try {
    if (id) {
      await fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(corps) });
    } else {
      await fetchAPI('/users', { method: 'POST', body: JSON.stringify(corps) });
    }
    fermerModal();
    chargerUtilisateurs();
  } catch (err) {
    alert(err.message);
  }
}

// Bascule le statut actif/inactif d'un utilisateur après confirmation
async function changerStatut(userId, actuelActif) {
  const nouveauStatut = !actuelActif;
  const action = nouveauStatut ? 'activer' : 'désactiver';
  if (!confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) return;

  try {
    await fetchAPI(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ actif: nouveauStatut })
    });
    chargerUtilisateurs();
  } catch (err) {
    alert(err.message);
  }
}

// Supprime définitivement un utilisateur après confirmation
async function supprimerUtilisateur(userId) {
  if (!confirm('Supprimer cet utilisateur définitivement ?')) return;

  try {
    await fetchAPI(`/users/${userId}`, { method: 'DELETE' });
    chargerUtilisateurs();
  } catch (err) {
    alert(err.message);
  }
}
