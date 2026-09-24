// Routes de gestion des programmes d'entraînement (ensemble de séances planifiées)
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProgrammes,
  getProgrammeById,
  createProgramme,
  updateProgramme,
  deleteProgramme,
} = require('../controllers/programmeController');

// GET /api/programmes/ — Lister les programmes de l'utilisateur connecté
router.get('/',       protect, getProgrammes);
// GET /api/programmes/:id — Récupérer le détail d'un programme
router.get('/:id',    protect, getProgrammeById);
// POST /api/programmes/ — Créer un nouveau programme d'entraînement
router.post('/',      protect, createProgramme);
// PUT /api/programmes/:id — Modifier un programme existant
router.put('/:id',    protect, updateProgramme);
// DELETE /api/programmes/:id — Supprimer un programme
router.delete('/:id', protect, deleteProgramme);

module.exports = router;
