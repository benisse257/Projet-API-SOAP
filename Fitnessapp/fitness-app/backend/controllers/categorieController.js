/**
 * Contrôleur des catégories d'exercices — FitTracker
 * CRUD pour la gestion des catégories (musculation, cardio, etc.).
 */

const Categorie = require('../models/Categorie');

/**
 * Récupère toutes les catégories d'exercices.
 * @route GET /api/categories
 * @returns {Array} Liste complète des catégories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Categorie.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Crée une nouvelle catégorie d'exercices.
 * @route POST /api/categories
 * @returns {Object} Catégorie créée
 */
exports.createCategory = async (req, res) => {
  try {
    const category = await Categorie.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Met à jour une catégorie existante par son identifiant.
 * @route PUT /api/categories/:id
 * @param {string} id - Identifiant de la catégorie
 * @returns {Object} Catégorie mise à jour
 */
exports.updateCategory = async (req, res) => {
  try {
    const category = await Categorie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};

/**
 * Supprime une catégorie par son identifiant.
 * @route DELETE /api/categories/:id
 * @param {string} id - Identifiant de la catégorie
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Categorie.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};
