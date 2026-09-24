/**
 * Contrôleur des détails de séance — FitTracker
 * Gestion des exercices inclus dans une séance (séries, répétitions, poids).
 * Chaque opération vérifie que l'utilisateur est bien propriétaire de la séance.
 */

const DetailSeance = require('../models/DetailSeance');
const Seance       = require('../models/Seance');

/**
 * Vérifie que la séance appartient à l'utilisateur demandeur.
 * @param {string} seanceId - Identifiant de la séance
 * @param {string} userId - Identifiant de l'utilisateur
 * @param {Object} res - Objet réponse Express
 * @returns {boolean} true si autorisé, false sinon (et envoie la réponse 403)
 */
const verifierPropriete = async (seanceId, userId, res) => {
  const seance = await Seance.findOne({ _id: seanceId, utilisateur: userId });
  if (!seance) { res.status(403).json({ message: 'Acces refuse' }); return false; }
  return true;
};

/**
 * Liste les détails d'une séance avec les informations de chaque exercice.
 * @route GET /api/seances/:seanceId/details
 * @param {string} seanceId - Identifiant de la séance
 * @returns {Array} Détails triés par ordre d'exécution
 */
exports.listerDetails = async (req, res) => {
  try {
    const ok = await verifierPropriete(req.params.seanceId, req.utilisateur.id, res);
    if (!ok) return;
    const details = await DetailSeance.find({ seance: req.params.seanceId })
      .populate('exercice', 'nom categorie niveauDifficulte muscles')
      .sort({ ordre: 1 });
    res.json(details);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Ajoute un exercice à une séance existante.
 * L'ordre est attribué automatiquement si non précisé.
 * @route POST /api/seances/:seanceId/details
 * @param {string} seanceId - Identifiant de la séance
 * @returns {Object} Détail créé avec les infos de l'exercice
 */
exports.ajouterDetail = async (req, res) => {
  try {
    const ok = await verifierPropriete(req.params.seanceId, req.utilisateur.id, res);
    if (!ok) return;
    // Calculer l'ordre automatiquement
    const count = await DetailSeance.countDocuments({ seance: req.params.seanceId });
    const detail = await DetailSeance.create({
      ...req.body,
      seance: req.params.seanceId,
      ordre: req.body.ordre || count + 1
    });
    await detail.populate('exercice', 'nom categorie');
    res.status(201).json(detail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Modifie un détail de séance (séries, poids, répétitions, etc.).
 * @route PUT /api/seances/:seanceId/details/:detailId
 * @param {string} seanceId - Identifiant de la séance
 * @param {string} detailId - Identifiant du détail
 * @returns {Object} Détail mis à jour
 */
exports.modifierDetail = async (req, res) => {
  try {
    const ok = await verifierPropriete(req.params.seanceId, req.utilisateur.id, res);
    if (!ok) return;
    const detail = await DetailSeance.findOneAndUpdate(
      { _id: req.params.detailId, seance: req.params.seanceId },
      req.body, { new: true }
    ).populate('exercice', 'nom categorie');
    if (!detail) return res.status(404).json({ message: 'Detail non trouve' });
    res.json(detail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Supprime un détail de séance et réordonne les exercices restants.
 * @route DELETE /api/seances/:seanceId/details/:detailId
 * @param {string} seanceId - Identifiant de la séance
 * @param {string} detailId - Identifiant du détail
 */
exports.supprimerDetail = async (req, res) => {
  try {
    const ok = await verifierPropriete(req.params.seanceId, req.utilisateur.id, res);
    if (!ok) return;
    await DetailSeance.findOneAndDelete({ _id: req.params.detailId, seance: req.params.seanceId });

    // Réordonner les exercices restants après suppression
    const restants = await DetailSeance.find({ seance: req.params.seanceId }).sort({ ordre: 1 });
    for (let i = 0; i < restants.length; i++)
      await DetailSeance.findByIdAndUpdate(restants[i]._id, { ordre: i + 1 });

    res.json({ message: 'Detail supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
