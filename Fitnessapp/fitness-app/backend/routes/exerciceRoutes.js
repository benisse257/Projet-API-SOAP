// Routes de gestion des exercices : consultation pour tous, modification réservée aux administrateurs
const router = require('express').Router();
const ctrl = require('../controllers/exerciceController');
const { proteger, admin } = require('../middleware/auth');

// GET /api/exercices/ — Lister tous les exercices disponibles
router.get('/',       proteger, ctrl.listerExercices);
// GET /api/exercices/:id — Récupérer le détail d'un exercice
router.get('/:id',    proteger, ctrl.obtenirExercice);
// POST /api/exercices/ — Créer un nouvel exercice (admin)
router.post('/',      proteger, admin, ctrl.creerExercice);
// PUT /api/exercices/:id — Modifier un exercice existant (admin)
router.put('/:id',    proteger, admin, ctrl.modifierExercice);
// DELETE /api/exercices/:id — Supprimer un exercice (admin)
router.delete('/:id', proteger, admin, ctrl.supprimerExercice);

module.exports = router;