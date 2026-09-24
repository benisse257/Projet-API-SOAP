// Routes d'authentification : inscription, connexion et récupération du profil utilisateur
const router = require('express').Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register — Inscription d'un nouvel utilisateur
router.post('/register', register);
// POST /api/auth/login — Connexion et obtention du token JWT
router.post('/login', login);
// GET /api/auth/me — Récupérer le profil de l'utilisateur connecté (protégé)
router.get('/me', protect, getMe);

module.exports = router;