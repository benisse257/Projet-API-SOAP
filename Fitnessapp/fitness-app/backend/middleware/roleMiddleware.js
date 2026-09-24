/**
 * Middleware de vérification des rôles
 * Restreint l'accès aux routes selon le rôle de l'utilisateur
 */

/**
 * Middleware réservé aux administrateurs
 * Vérifie que req.utilisateur.role est égal à 'admin'
 * Doit être utilisé après un middleware d'authentification
 */
const adminOnly = (req, res, next) => {
  if (req.utilisateur?.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé, réservé aux administrateurs' });
  }
  next();
};

module.exports = { adminOnly };
