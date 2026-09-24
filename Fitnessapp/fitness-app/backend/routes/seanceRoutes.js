// Routes de gestion des séances d'entraînement
const router = require('express').Router();
const ctrl = require('../controllers/seanceController');
const { proteger } = require('../middleware/auth');

// GET /api/seances/ — Lister les séances de l'utilisateur connecté
router.get('/',       proteger, ctrl.listerSeances);
// POST /api/seances/ — Créer une nouvelle séance d'entraînement
router.post('/',      proteger, ctrl.creerSeance);
// GET /api/seances/:id — Récupérer le détail d'une séance
router.get('/:id',    proteger, ctrl.obtenirSeance);
// PUT /api/seances/:id — Modifier une séance existante
router.put('/:id',    proteger, ctrl.modifierSeance);
// DELETE /api/seances/:id — Supprimer une séance
router.delete('/:id', proteger, ctrl.supprimerSeance);

// Sous-route : gestion des détails (exercices) d'une séance
router.use('/:seanceId/details', require('./detailSeanceRoutes'));

module.exports = router;