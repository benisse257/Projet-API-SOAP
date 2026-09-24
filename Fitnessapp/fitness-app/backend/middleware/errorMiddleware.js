/**
 * Middleware global de gestion des erreurs
 * Intercepte toutes les erreurs et renvoie une réponse JSON standardisée
 */

/**
 * Gestionnaire centralisé des erreurs
 * Utilisé via app.use() à la fin de la chaîne de middleware Express
 */
const errorMiddleware = (err, req, res, next) => {
  // Utilise le code status de l'erreur ou 500 par défaut
  res.status(err.statusCode || 500).json({
    message: err.message || 'Erreur serveur'
  });
};

module.exports = errorMiddleware;
