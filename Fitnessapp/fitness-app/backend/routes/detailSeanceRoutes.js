// Routes de gestion des détails de séance : exercices associés à une séance (sous-ressource)
const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/detailSeanceController');
const { proteger } = require('../middleware/auth');

// GET /api/seances/:seanceId/details/ — Lister les exercices d'une séance
router.get('/',              proteger, ctrl.listerDetails);
// POST /api/seances/:seanceId/details/ — Ajouter un exercice à la séance
router.post('/',             proteger, ctrl.ajouterDetail);
// PUT /api/seances/:seanceId/details/:detailId — Modifier un exercice de la séance
router.put('/:detailId',     proteger, ctrl.modifierDetail);
// DELETE /api/seances/:seanceId/details/:detailId — Retirer un exercice de la séance
router.delete('/:detailId',  proteger, ctrl.supprimerDetail);

module.exports = router;