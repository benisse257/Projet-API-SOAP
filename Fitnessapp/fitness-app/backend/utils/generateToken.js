/**
 * Utilitaire de génération de tokens JWT
 * Crée des tokens signés pour l'authentification des utilisateurs
 */

const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT contenant l'identifiant et le rôle de l'utilisateur
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} role - Rôle de l'utilisateur (sportif, admin, etc.)
 * @returns {string} Token JWT signé
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = generateToken;
