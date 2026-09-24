/**
 * Contrôleur de gestion des utilisateurs — FitTracker
 * CRUD administratif pour les comptes utilisateurs (sportifs et admins).
 */

const Utilisateur = require('../models/Utilisateur');

/**
 * Récupère la liste de tous les utilisateurs (excluant les mots de passe).
 * @route GET /api/users
 * @returns {Array} Liste des utilisateurs triés par date de création décroissante
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Utilisateur.find().select('-motDePasse').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Récupère un utilisateur par son identifiant.
 * @route GET /api/users/:id
 * @param {string} id - Identifiant de l'utilisateur
 * @returns {Object} Données de l'utilisateur
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id).select('-motDePasse');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Crée un nouvel utilisateur (usage administratif).
 * Vérifie l'unicité de l'email avant la création.
 * @route POST /api/users
 * @returns {Object} Utilisateur créé (sans le mot de passe)
 */
exports.createUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role, age, poids, taille, objectif_principal } = req.body;

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont obligatoires' });
    }

    // Vérifier que l'email n'est pas déjà utilisé
    const existeDeja = await Utilisateur.findOne({ email: email.toLowerCase() });
    if (existeDeja) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const user = await Utilisateur.create({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      motDePasse,
      role: role || 'sportif',
      age: age || undefined,
      poids: poids || undefined,
      taille: taille || undefined,
      objectif_principal: objectif_principal || undefined
    });

    // Retourner l'utilisateur sans le mot de passe
    const userSansMDP = user.toObject();
    delete userSansMDP.motDePasse;

    res.status(201).json(userSansMDP);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Met à jour les informations d'un utilisateur existant.
 * @route PUT /api/users/:id
 * @param {string} id - Identifiant de l'utilisateur
 * @returns {Object} Utilisateur mis à jour
 */
exports.updateUser = async (req, res) => {
  try {
    const { nom, email, role, age, poids, taille, objectif_principal, actif } = req.body;

    const user = await Utilisateur.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    // Vérification de l'unicité si l'email est modifié
    if (email && email.toLowerCase() !== user.email) {
      const existeDeja = await Utilisateur.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (existeDeja) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      user.email = email.toLowerCase().trim();
    }

    // Mise à jour sélective des champs fournis
    if (nom !== undefined)         user.nom = nom.trim();
    if (role !== undefined)        user.role = role;
    if (age !== undefined)         user.age = age;
    if (poids !== undefined)       user.poids = poids;
    if (taille !== undefined)      user.taille = taille;
    if (objectif_principal !== undefined) user.objectif_principal = objectif_principal;
    if (actif !== undefined)       user.actif = actif;

    await user.save();

    const userSansMDP = user.toObject();
    delete userSansMDP.motDePasse;

    res.json(userSansMDP);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Supprime un utilisateur par son identifiant.
 * Empêche la suppression du dernier administrateur.
 * @route DELETE /api/users/:id
 * @param {string} id - Identifiant de l'utilisateur
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    // Sécurité : ne pas supprimer le dernier admin
    if (user.role === 'admin') {
      const admins = await Utilisateur.countDocuments({ role: 'admin' });
      if (admins <= 1) {
        return res.status(400).json({ message: 'Impossible de supprimer le dernier administrateur' });
      }
    }

    await Utilisateur.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Change le rôle d'un utilisateur (sportif ↔ admin).
 * Empêche la rétrogradation du dernier administrateur.
 * @route PATCH /api/users/:id/role
 * @param {string} id - Identifiant de l'utilisateur
 * @returns {Object} Utilisateur avec le nouveau rôle
 */
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['sportif', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    // Sécurité : ne pas rétrograder le dernier admin
    if (role === 'sportif') {
      const user = await Utilisateur.findById(req.params.id);
      if (user && user.role === 'admin') {
        const admins = await Utilisateur.countDocuments({ role: 'admin' });
        if (admins <= 1) {
          return res.status(400).json({ message: 'Impossible de rétrograder le dernier administrateur' });
        }
      }
    }

    const user = await Utilisateur.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-motDePasse');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Active ou désactive le compte d'un utilisateur.
 * @route PATCH /api/users/:id/status
 * @param {string} id - Identifiant de l'utilisateur
 * @returns {Object} Utilisateur mis à jour
 */
exports.changeUserStatus = async (req, res) => {
  try {
    const { actif } = req.body;

    const user = await Utilisateur.findByIdAndUpdate(
      req.params.id,
      { actif },
      { new: true }
    ).select('-motDePasse');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};
