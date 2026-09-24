/**
 * Contrôleur des exercices — FitTracker
 * Gestion CRUD des exercices avec filtrage par catégorie, niveau et recherche.
 */

const Exercice = require('../models/Exercice');

/**
 * Liste les exercices avec filtrage optionnel.
 * @route GET /api/exercices
 * @query {string} categorie - Filtrer par catégorie
 * @query {string} niveau - Filtrer par niveau de difficulté
 * @query {string} recherche - Recherche par nom (insensible à la casse)
 * @returns {Array} Liste des exercices correspondants
 */
exports.listerExercices = async (req, res) => {
  try {
    const filtre = {};
    if (req.query.categorie)  filtre.categorie         = req.query.categorie;
    if (req.query.niveau)     filtre.niveauDifficulte  = req.query.niveau;
    // Recherche regex par nom avec correspondance partielle
    if (req.query.recherche)  filtre.nom = { $regex: req.query.recherche, $options: 'i' };

    const exercices = await Exercice.find(filtre).populate('creePar', 'nom');
    res.json(exercices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Récupère un exercice par son identifiant.
 * @route GET /api/exercices/:id
 * @param {string} id - Identifiant de l'exercice
 * @returns {Object} Détails de l'exercice avec le nom du créateur
 */
exports.obtenirExercice = async (req, res) => {
  try {
    const exercice = await Exercice.findById(req.params.id).populate('creePar', 'nom');
    if (!exercice) return res.status(404).json({ message: 'Exercice non trouve' });
    res.json(exercice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Crée un nouvel exercice.
 * L'utilisateur authentifié est enregistré comme créateur.
 * @route POST /api/exercices
 * @returns {Object} Exercice créé
 */
exports.creerExercice = async (req, res) => {
  try {
    const exercice = await Exercice.create({ ...req.body, creePar: req.utilisateur.id });
    res.status(201).json(exercice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Modifie un exercice existant.
 * @route PUT /api/exercices/:id
 * @param {string} id - Identifiant de l'exercice
 * @returns {Object} Exercice mis à jour
 */
exports.modifierExercice = async (req, res) => {
  try {
    const exercice = await Exercice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exercice) return res.status(404).json({ message: 'Exercice non trouve' });
    res.json(exercice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Supprime un exercice (réservé aux administrateurs).
 * @route DELETE /api/exercices/:id
 * @param {string} id - Identifiant de l'exercice
 */
exports.supprimerExercice = async (req, res) => {
  try {
    await Exercice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exercice supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
