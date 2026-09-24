/**
 * Contrôleur des séances d'entraînement — FitTracker
 * CRUD des séances avec création automatique de l'historique
 * lorsqu'une séance est marquée comme réalisée.
 */

const Seance = require('../models/Seance');
const DetailSeance = require('../models/DetailSeance');
const Historique = require('../models/Historique');

/**
 * Liste les séances de l'utilisateur connecté.
 * @route GET /api/seances
 * @returns {Array} Séances triées par date de création décroissante
 */
exports.listerSeances = async (req, res) => {
  try {
    const seances = await Seance.find({ utilisateur: req.utilisateur.id }).sort({ createdAt: -1 });
    res.json(seances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Crée une nouvelle séance d'entraînement.
 * @route POST /api/seances
 * @returns {Object} Séance créée
 */
exports.creerSeance = async (req, res) => {
  try {
    const seance = await Seance.create({ ...req.body, utilisateur: req.utilisateur.id });
    res.status(201).json(seance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Récupère une séance spécifique appartenant à l'utilisateur.
 * @route GET /api/seances/:id
 * @param {string} id - Identifiant de la séance
 * @returns {Object} Détails de la séance
 */
exports.obtenirSeance = async (req, res) => {
  try {
    const seance = await Seance.findOne({ _id: req.params.id, utilisateur: req.utilisateur.id });
    if (!seance) return res.status(404).json({ message: 'Seance non trouvee' });
    res.json(seance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Modifie une séance et crée automatiquement une entrée historique
 * lorsqu'on la marque pour la première fois comme « réalisée ».
 * @route PUT /api/seances/:id
 * @param {string} id - Identifiant de la séance
 * @returns {Object} Séance mise à jour
 */
exports.modifierSeance = async (req, res) => {
  try {
    const seance = await Seance.findOne({
      _id: req.params.id,
      utilisateur: req.utilisateur.id
    });

    if (!seance) {
      return res.status(404).json({ success: false, error: 'Séance introuvable.' });
    }

    // Mettre à jour les champs autorisés
    seance.nom = req.body.nom || seance.nom;
    seance.description = req.body.description || seance.description;

    // Vérifier si on passe le statut à "realisee"
    const etaitDejaRealisee = seance.statut === 'realisee';
    if (req.body.statut) seance.statut = req.body.statut;

    await seance.save();

    // Créer l'entrée historique seulement si on vient de passer à "realisee"
    if (req.body.statut === 'realisee' && !etaitDejaRealisee) {
      // Récupérer tous les exercices de la séance
      const detailsSeance = await DetailSeance.find({ seance: seance._id });

      // Transformer les détails en format historique
      const exercicesRealises = detailsSeance.map((detail) => ({
        exercice_id: detail.exercice,
        seriesRealisees: detail.series,
        repetitionsRealisees: detail.repetitions,
        poidsUtilise: detail.poidsKg,
        dureeReelle: detail.dureeSecondes
      }));

      // Enregistrer la séance dans l'historique
      await Historique.create({
        utilisateur_id: req.utilisateur.id,
        seance_id: seance._id,
        dateRealisation: new Date(),
        dureeTotale: req.body.dureeTotale || 0,
        caloriesEstimees: req.body.caloriesEstimees || 0,
        commentaire: req.body.commentaire || '',
        exercicesRealises: exercicesRealises
      });
    }

    return res.status(200).json({ success: true, data: seance });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * Supprime une séance appartenant à l'utilisateur.
 * @route DELETE /api/seances/:id
 * @param {string} id - Identifiant de la séance
 */
exports.supprimerSeance = async (req, res) => {
  try {
    await Seance.findOneAndDelete({ _id: req.params.id, utilisateur: req.utilisateur.id });
    res.json({ message: 'Seance supprimee' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
