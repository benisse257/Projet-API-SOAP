/**
 * Utilitaires pour réponses standardisées et gestion d'erreurs
 * Fournit des fonctions helper pour uniformiser les réponses JSON de l'API
 */

// --- Réponses de succès ---

/**
 * Envoie une réponse de succès avec les données
 * @param {object} res - Objet réponse Express
 * @param {*} data - Données à renvoyer
 * @param {number} status - Code HTTP (défaut : 200)
 */
const reussite = (res, data, status = 200) => {
  res.status(status).json({
    success: true,
    data
  });
};

// --- Réponses d'erreur ---

/**
 * Envoie une réponse d'erreur générique
 * @param {object} res - Objet réponse Express
 * @param {string} message - Message d'erreur
 * @param {number} status - Code HTTP (défaut : 500)
 * @param {object|null} details - Détails supplémentaires optionnels
 */
const erreur = (res, message = 'Erreur serveur', status = 500, details = null) => {
  res.status(status).json({
    success: false,
    error: message,
    ...(details && { details })
  });
};

// --- Erreurs spécifiques ---

/**
 * Erreur de validation des données (code 400)
 * @param {object} res - Objet réponse Express
 * @param {object} champs - Objet contenant les erreurs par champ
 */
const erreurValidation = (res, champs = {}) => {
  res.status(400).json({
    success: false,
    error: 'Erreur de validation',
    details: champs
  });
};

/**
 * Erreur de ressource introuvée (code 404)
 * @param {object} res - Objet réponse Express
 * @param {string} ressource - Nom de la ressource recherchée
 */
const nonTrouve = (res, ressource = 'Ressource') => {
  res.status(404).json({
    success: false,
    error: `${ressource} non trouvée`
  });
};

/**
 * Erreur d'accès refusé (code 403)
 * @param {object} res - Objet réponse Express
 * @param {string} message - Message d'erreur personnalisé
 */
const nonAutorise = (res, message = 'Accès refusé') => {
  res.status(403).json({
    success: false,
    error: message
  });
};

/**
 * Erreur d'authentification requise (code 401)
 * @param {object} res - Objet réponse Express
 */
const nonAuthentifie = (res) => {
  res.status(401).json({
    success: false,
    error: 'Non authentifié'
  });
};

/**
 * Erreur de conflit (code 409) - ressource déjà existante
 * @param {object} res - Objet réponse Express
 * @param {string} message - Message d'erreur personnalisé
 */
const conflit = (res, message = 'Ressource déjà existante') => {
  res.status(409).json({
    success: false,
    error: message
  });
};

module.exports = {
  reussite,
  erreur,
  erreurValidation,
  nonTrouve,
  nonAutorise,
  nonAuthentifie,
  conflit
};
