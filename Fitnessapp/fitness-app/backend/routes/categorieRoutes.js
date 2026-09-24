// Routes de gestion des catégories d'exercices (CRUD)
const router = require('express').Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categorieController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// GET /api/categories/ — Lister toutes les catégories (utilisateur connecté)
router.get('/', protect, getAllCategories);
// POST /api/categories/ — Créer une nouvelle catégorie (admin uniquement)
router.post('/', protect, adminOnly, createCategory);
// PUT /api/categories/:id — Modifier une catégorie (admin uniquement)
router.put('/:id', protect, adminOnly, updateCategory);
// DELETE /api/categories/:id — Supprimer une catégorie (admin uniquement)
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
