// =====================================================================
// Client API - FitTracker
// Module centralisé pour les requêtes HTTP vers le backend
// =====================================================================

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

// Vérifie si l'utilisateur courant a le rôle administrateur
function isAdmin() {
  return localStorage.getItem('role') === 'admin';
}

// Envoie une requête API avec authentification et gestion d'erreurs
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Ajoute le token d'authentification si disponible
  if (getToken()) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Parse la réponse en toute sécurité, lève une erreur si le statut est invalide
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Erreur API');
  }
  return data;
}

// Point d'entrée public pour tous les appels API du frontend
async function fetchAPI(endpoint, options = {}) {
  return apiRequest(endpoint, options);
}
