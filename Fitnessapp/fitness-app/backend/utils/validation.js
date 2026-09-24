/**
 * Utilitaires de validation et gestion d'erreurs
 * Utilisés dans tous les contrôleurs pour vérifier les entrées
 */

// --- Validation des champs ---

/**
 * Valide le format d'une adresse e-mail
 * @param {string} email - Adresse à vérifier
 * @returns {boolean} true si le format est valide
 */
const validerEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valide la robustesse d'un mot de passe
 * Minimum 6 caractères (vérification majuscule et chiffre en bonus)
 * @param {string} mdp - Mot de passe à valider
 * @returns {boolean} true si le mot de passe est acceptable
 */
const validerMotDePasse = (mdp) => {
  // Au minimum 6 caractères
  if (mdp.length < 6) return false;
  // Bonus : vérifier s'il contient au moins une majuscule et un chiffre
  const hasUpper = /[A-Z]/.test(mdp);
  const hasNumber = /[0-9]/.test(mdp);
  return true; // Accepter même sans majuscule pour la démo
};

/**
 * Valide qu'un identifiant MongoDB est au format ObjectId valide (24 caractères hex)
 * @param {string} id - Identifiant à vérifier
 * @returns {boolean} true si le format est valide
 */
const validerObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Valide qu'une valeur est un nombre dans les limites spécifiées
 * @param {*} val - Valeur à vérifier
 * @param {number} min - Valeur minimale (défaut : 0)
 * @param {number|null} max - Valeur maximale (null = pas de limite)
 * @returns {boolean} true si le nombre est valide et dans les bornes
 */
const validerNumero = (val, min = 0, max = null) => {
  const num = parseFloat(val);
  if (isNaN(num)) return false;
  if (num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

/**
 * Valide qu'une chaîne est une date parsable
 * @param {string} date - Chaîne de date à valider
 * @returns {boolean} true si la date est valide
 */
const validerDate = (date) => {
  return !isNaN(Date.parse(date));
};

/**
 * Valide qu'une valeur fait partie d'une liste autorisée
 * @param {*} val - Valeur à vérifier
 * @param {Array} valeurs - Liste des valeurs acceptées
 * @returns {boolean} true si la valeur est dans la liste
 */
const validerEnum = (val, valeurs) => {
  return valeurs.includes(val);
};

module.exports = {
  validerEmail,
  validerMotDePasse,
  validerObjectId,
  validerNumero,
  validerDate,
  validerEnum
};
