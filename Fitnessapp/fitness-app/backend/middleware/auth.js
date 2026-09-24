/**
 * Middleware d'authentification JWT
 * Protège les routes nécessitant une connexion et les routes admin
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware de protection des routes
 * Vérifie la validité du token JWT dans l'en-tête Authorization
 * Attache les informations utilisateur à req.utilisateur et req.user
 */
const proteger = (req, res, next) => {
  // Extraction du token depuis l'en-tête Bearer
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Acces refuse, token manquant' });
  try {
    // Vérification et décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateur = { id: decoded.id, role: decoded.role };
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

/**
 * Middleware de restriction aux administrateurs
 * Doit être utilisé après le middleware proteger
 */
const admin = (req, res, next) => {
  if (req.utilisateur.role !== 'admin')
    return res.status(403).json({ message: 'Acces reserve a l administrateur' });
  next();
};

module.exports = { proteger, admin };