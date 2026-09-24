// =====================================================================
// Utilitaires partagés - FitTracker
// Fonctions d'authentification, appels API et composants réutilisables
// =====================================================================

const API = '/api';

// Raccourcis d'accès au stockage local pour les données utilisateur
function getToken()  { return localStorage.getItem('token'); }
function getNom()    { return localStorage.getItem('nom'); }
function getRole()   { return localStorage.getItem('role'); }

// Redirige vers la page d'accueil si l'utilisateur n'est pas authentifié
function verifierAuth() {
  if (!getToken()) window.location.href = '/';
}

// Efface toutes les données de session et redirige
function seDeconnecter() {
  localStorage.clear();
  window.location.href = '/';
}

// Affiche le nom et le rôle de l'utilisateur dans l'interface
function afficherNom() {
  const nom = getNom() || 'Utilisateur';
  const role = getRole() ? ` (${getRole()})` : '';
  const texte = `${nom}${role}`;

  const elSportif = document.getElementById('nomUser');
  const elAdmin   = document.getElementById('nomUserAdmin');
  if (elSportif) elSportif.textContent = texte;
  if (elAdmin)   elAdmin.textContent   = texte;
}

// Effectue un appel API authentifié et gère automatiquement la déconnexion en cas de 401
async function appelAPI(endpoint, methode = 'GET', corps = null) {
  const options = {
    method: methode,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    }
  };
  if (corps) options.body = JSON.stringify(corps);
  const rep = await fetch(API + endpoint, options);
  if (rep.status === 401) { seDeconnecter(); return null; }
  return await rep.json();
}

// Génère un badge HTML coloré pour une catégorie d'exercice
function badgeCategorie(cat) {
  const classes = {
    musculation: 'badge-musculation',
    cardio:      'badge-cardio',
    flexibilite: 'badge-flexibilite',
    equilibre:   'badge-equilibre'
  };
  return `<span class="badge ${classes[cat] || ''}">${cat}</span>`;
}

// Génère un badge HTML pour le niveau de compétence
function badgeNiveau(niv) {
  const classes = {
    debutant:     'badge-debutant',
    intermediaire:'badge-intermediaire',
    avance:       'badge-avance'
  };
  return `<span class="badge ${classes[niv] || ''}">${niv}</span>`;
}

// Formate une date au format français jj/mm/aaaa
function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
