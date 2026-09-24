// Routes médicales : profil médical synchronisé depuis le serveur SOAP Spring Boot
const router = require('express').Router();
const { getMedicalProfile, validerProgramme } = require('../controllers/medicalController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/medical/profile — Profil médical de l'utilisateur connecté (protégé)
router.get('/profile', protect, getMedicalProfile);

// POST /api/medical/validate-program — Vérifie un programme contre les restrictions médicales (protégé)
router.post('/validate-program', protect, validerProgramme);

module.exports = router;