/**
 * Contrôleur des programmes d'entraînement — FitTracker
 * CRUD pour la création et la gestion des programmes
 * regroupant plusieurs séances sur une période donnée.
 */

const Programme = require('../models/Programme');

/**
 * Liste les programmes de l'utilisateur avec les séances associées.
 * @route GET /api/programmes
 * @returns {Array} Programmes triés par date de création décroissante
 */
exports.getProgrammes = async (req, res) => {
  try {
    const programmes = await Programme
      .find({ utilisateur_id: req.utilisateur.id })
      .populate('seances_ids', 'nom dureeEstimee statut')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: programmes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Récupère un programme par son identifiant avec les détails des séances.
 * @route GET /api/programmes/:id
 * @param {string} id - Identifiant du programme
 * @returns {Object} Programme avec descriptions complètes des séances
 */
exports.getProgrammeById = async (req, res) => {
  try {
    const programme = await Programme
      .findOne({ _id: req.params.id, utilisateur_id: req.utilisateur.id })
      .populate('seances_ids', 'nom description dureeEstimee statut');

    if (!programme) {
      return res.status(404).json({ success: false, error: 'Programme introuvable.' });
    }

    return res.status(200).json({ success: true, data: programme });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Crée un nouveau programme d'entraînement.
 * Le programme doit contenir au moins une séance et un nom non vide.
 * @route POST /api/programmes
 * @returns {Object} Programme créé avec ses séances peuplées
 */
exports.createProgramme = async (req, res) => {
  try {
    const { nom, description, dateDebut, dateFin, seances_ids } = req.body;

    // Validation du nom
    if (!nom || nom.trim() === '') {
      return res.status(400).json({ success: false, error: 'Le nom du programme est obligatoire.' });
    }

    // Validation : au moins une séance requise
    if (!seances_ids || seances_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Un programme doit contenir au moins une séance.' });
    }

    const programme = await Programme.create({
      utilisateur_id: req.utilisateur.id,
      nom           : nom.trim(),
      description   : description || '',
      dateDebut     : dateDebut   || null,
      dateFin       : dateFin     || null,
      seances_ids,
    });

    // Recharger avec peuplement des séances pour la réponse
    const programmePeuple = await Programme
      .findById(programme._id)
      .populate('seances_ids', 'nom dureeEstimee statut');

    return res.status(201).json({ success: true, data: programmePeuple });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * Met à jour un programme existant.
 * @route PUT /api/programmes/:id
 * @param {string} id - Identifiant du programme
 * @returns {Object} Programme mis à jour avec ses séances peuplées
 */
exports.updateProgramme = async (req, res) => {
  try {
    const programme = await Programme.findOne({
      _id: req.params.id,
      utilisateur_id: req.utilisateur.id,
    });

    if (!programme) {
      return res.status(404).json({ success: false, error: 'Programme introuvable.' });
    }

    // Mise à jour sélective des champs fournis
    if (req.body.nom !== undefined)         programme.nom         = req.body.nom.trim();
    if (req.body.description !== undefined) programme.description = req.body.description;
    if (req.body.dateDebut !== undefined)   programme.dateDebut   = req.body.dateDebut;
    if (req.body.dateFin !== undefined)     programme.dateFin     = req.body.dateFin;
    if (req.body.seances_ids !== undefined) programme.seances_ids = req.body.seances_ids;

    await programme.save();

    // Recharger avec peuplement des séances pour la réponse
    const programmePeuple = await Programme
      .findById(programme._id)
      .populate('seances_ids', 'nom dureeEstimee statut');

    return res.status(200).json({ success: true, data: programmePeuple });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * Supprime un programme de l'utilisateur.
 * @route DELETE /api/programmes/:id
 * @param {string} id - Identifiant du programme
 */
exports.deleteProgramme = async (req, res) => {
  try {
    const programme = await Programme.findOneAndDelete({
      _id: req.params.id,
      utilisateur_id: req.utilisateur.id,
    });

    if (!programme) {
      return res.status(404).json({ success: false, error: 'Programme introuvable.' });
    }

    return res.status(200).json({ success: true, data: { message: 'Programme supprimé avec succès.' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
