/**
 * Contrôleur d'authentification — FitTracker
 * Gère l'inscription, la connexion et la récupération du profil utilisateur.
 */

const User = require('../models/Utilisateur');
const generateToken = require('../utils/generateToken');
const { validerEmail, validerMotDePasse } = require('../utils/validation');

/**
 * Extrait le nom complet à partir du corps de la requête.
 * Accepte le champ `nom` ou la combinaison `firstName`/`lastName`.
 * @param {Object} body - Corps de la requête
 * @returns {string} Nom nettoyé
 */
const extraireNom = (body) => {
  if (body.nom) return body.nom.trim();
  if (body.firstName || body.lastName) {
    return `${body.firstName || ''} ${body.lastName || ''}`.trim();
  }
  return '';
};

/** Extrait le mot de passe en acceptant les variantes de nommage. */
const extraireMotDePasse = (body) => body.motDePasse || body.password || '';

/**
 * Inscription d'un nouvel utilisateur.
 * Crée un compte avec les données personnelles et retourne un token JWT.
 * @route POST /api/auth/register
 * @returns {Object} Token JWT et informations de l'utilisateur créé
 */
exports.register = async (req, res) => {
  try {
    const nom = extraireNom(req.body);
    const email = (req.body.email || '').trim().toLowerCase();
    const motDePasse = extraireMotDePasse(req.body);

    // Vérification des champs obligatoires
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }
    if (!validerEmail(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }
    if (!validerMotDePasse(motDePasse)) {
      return res.status(400).json({ message: 'Mot de passe invalide' });
    }

    // Vérification de l'unicité de l'email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Création de l'utilisateur avec rôle par défaut 'sportif'
    const user = await User.create({
      nom,
      email,
      motDePasse,
      role: 'sportif',
      age: req.body.age,
      poids: req.body.poids,
      taille: req.body.taille,
      objectif_principal: req.body.objectif_principal
    });

    res.status(201).json({
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        age: user.age,
        poids: user.poids,
        taille: user.taille,
        objectif_principal: user.objectif_principal
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Connexion d'un utilisateur existant.
 * Vérifie les identifiants et retourne un token JWT.
 * @route POST /api/auth/login
 * @returns {Object} Token JWT et informations de l'utilisateur
 */
exports.login = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const motDePasse = extraireMotDePasse(req.body);

    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    // Recherche de l'utilisateur et vérification du mot de passe
    const user = await User.findOne({ email });
    if (!user || !(await user.comparerMotDePasse(motDePasse))) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    // Vérification que le compte est actif
    if (!user.actif) {
      return res.status(403).json({ message: 'Compte désactivé. Contactez l\'administrateur.' });
    }

    res.status(200).json({
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Récupère le profil de l'utilisateur connecté.
 * @route GET /api/auth/me
 * @returns {Object} Données de l'utilisateur (sans le mot de passe)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};
