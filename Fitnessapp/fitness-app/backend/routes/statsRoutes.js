// Routes de consultation des statistiques : données personnelles et globales
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const {
  getStatsPersonnelles,
  getStatsGlobales
} = require('../controllers/statsController');

// Statistiques personnelles : utilisateur connecté uniquement
// GET /api/stats/me — Récupérer les statistiques personnelles de l'utilisateur
router.get('/me', protect, getStatsPersonnelles);

// Statistiques globales : admin uniquement
// GET /api/stats/global — Récupérer les statistiques globales de la plateforme
router.get('/global', protect, adminOnly, getStatsGlobales);

module.exports = router;
