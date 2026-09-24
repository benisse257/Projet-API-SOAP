/**
 * Middleware d'authentification JWT
 * Protège les routes en vérifiant la validité du token porteur
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware de protection des routes
 * Exige un en-tête Authorization avec un token Bearer valide
 * Stocke les données utilisateur dans req.user et req.utilisateur
 */
const protect = (req, res, next) => {
  // Vérification de la présence de l'en-tête Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  // Extraction du token après le préfixe Bearer
  const token = authHeader.split(' ')[1];

  try {
    // Décodage et validation du token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    req.utilisateur = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Non autorisé' });
  }
};

module.exports = { protect };
