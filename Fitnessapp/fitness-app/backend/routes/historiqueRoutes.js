// Routes de consultation et d'enregistrement de l'historique d'entraînement
const express = require('express');
const router = express.Router();
const { proteger } = require('../middleware/auth');
const { getHistorique, createHistorique } = require('../controllers/historiqueController');

// Toutes les routes historique sont protégées par JWT
// GET /api/historique/ — Consulter l'historique de l'utilisateur connecté
router.get('/', proteger, getHistorique);
// POST /api/historique/ — Enregistrer une nouvelle entrée d'historique
router.post('/', proteger, createHistorique);

module.exports = router;