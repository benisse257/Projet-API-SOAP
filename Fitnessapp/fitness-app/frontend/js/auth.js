// =====================================================================
// Module d'authentification - FitTracker
// Gère la connexion, l'inscription et l'affichage des formulaires
// =====================================================================

const API = '/api/auth';

// Inverse le type du champ entre 'password' et 'texte' pour l'accessibilité
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  button.innerHTML = isPassword ? '🙈' : '👁️';
  button.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
}

/* =========================
   AFFICHER ONGLET
========================= */
// Bascule l'affichage entre l'onglet connexion et inscription
function afficherOnglet(onglet) {
  document.getElementById('connexion').style.display =
    onglet === 'connexion' ? 'block' : 'none';

  document.getElementById('inscription').style.display =
    onglet === 'inscription' ? 'block' : 'none';

  // Met à jour l'état actif des onglets selon le sélection
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0) === (onglet === 'connexion'));
  });

  document.getElementById('msg').textContent = '';
}

/* =========================
   CONNEXION
========================= */
// Envoie les identifiants au serveur et redirige selon le rôle
async function seConnecter() {
  const email = document.getElementById('c-email').value.trim();
  const motDePasse = document.getElementById('c-mdp').value;
  const msg = document.getElementById('msg');

  if (!email || !motDePasse) {
    msg.textContent = 'Remplissez tous les champs';
    return;
  }

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || 'Erreur connexion';
      return;
    }

    // Persiste les informations d'authentification côté client
    localStorage.setItem('token', data.token);
    localStorage.setItem('nom', data.user.nom);
    localStorage.setItem('userName', data.user.nom);
    localStorage.setItem('role', data.user.role);

    // Redirection selon le rôle utilisateur
    if (data.user.role === 'admin') {
      window.location.href = '/admin-dashboard';
    } else {
      window.location.href = '/dashboard';
    }

  } catch (err) {
    msg.textContent = 'Erreur de connexion au serveur';
    console.error(err);
  }
}

/* =========================
   INSCRIPTION
========================= */
// Crée un nouveau compte utilisateur puis redirige
async function sInscrire() {
  const msg = document.getElementById('msg');

  // Construit le corps de la requête avec les champs optionnels
  const corps = {
    nom: document.getElementById('i-nom').value.trim(),
    email: document.getElementById('i-email').value.trim(),
    motDePasse: document.getElementById('i-mdp').value,
    age: parseInt(document.getElementById('i-age').value) || undefined,
    poids: parseFloat(document.getElementById('i-poids').value) || undefined,
    taille: parseInt(document.getElementById('i-taille').value) || undefined,
    objectif_principal: document.getElementById('i-objectif').value || undefined,
  };

  if (!corps.nom || !corps.email || !corps.motDePasse) {
    msg.textContent = 'Nom, email et mot de passe sont obligatoires';
    return;
  }

  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps)
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || 'Erreur inscription';
      return;
    }

    // Sauvegarde la session et redirige
    localStorage.setItem('token', data.token);
    localStorage.setItem('nom', data.user.nom);
    localStorage.setItem('userName', data.user.nom);
    localStorage.setItem('role', data.user.role);

    if (data.user.role === 'admin') {
      window.location.href = '/admin-dashboard';
    } else {
      window.location.href = '/dashboard';
    }

  } catch (err) {
    msg.textContent = 'Erreur de connexion au serveur';
    console.error(err);
  }
}
