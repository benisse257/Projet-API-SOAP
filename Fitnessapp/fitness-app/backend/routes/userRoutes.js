// Routes de gestion des utilisateurs : opérations CRUD réservées aux administrateurs
const router = require('express').Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  changeUserStatus
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// GET /api/users/ — Lister tous les utilisateurs
router.get('/',     protect, adminOnly, getAllUsers);
// GET /api/users/:id — Récupérer un utilisateur par son identifiant
router.get('/:id',  protect, adminOnly, getUserById);
// POST /api/users/ — Créer un nouvel utilisateur
router.post('/',    protect, adminOnly, createUser);
// PUT /api/users/:id — Modifier les informations d'un utilisateur
router.put('/:id',  protect, adminOnly, updateUser);
// DELETE /api/users/:id — Supprimer un utilisateur
router.delete('/:id', protect, adminOnly, deleteUser);
// PATCH /api/users/:id/role — Changer le rôle d'un utilisateur (sportif/admin)
router.patch('/:id/role',   protect, adminOnly, changeUserRole);
// PATCH /api/users/:id/status — Activer ou désactiver un utilisateur
router.patch('/:id/status', protect, adminOnly, changeUserStatus);

module.exports = router;
