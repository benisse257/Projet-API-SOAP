// Routes de gestion des objectifs personnels de l'utilisateur (poids, séances, calories...)
const router = require('express').Router();
const ctrl = require('../controllers/objectifController');
const { proteger } = require('../middleware/auth');

// GET /api/objectifs/ — Lister les objectifs de l'utilisateur connecté
router.get('/',       proteger, ctrl.listerObjectifs);
// POST /api/objectifs/ — Créer un nouvel objectif
router.post('/',      proteger, ctrl.creerObjectif);
// PUT /api/objectifs/:id — Modifier un objectif existant
router.put('/:id',    proteger, ctrl.modifierObjectif);
// DELETE /api/objectifs/:id — Supprimer un objectif
router.delete('/:id', proteger, ctrl.supprimerObjectif);

module.exports = router;