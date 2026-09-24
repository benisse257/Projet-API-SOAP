/**
 * Contrôleur de l'historique des entraînements — FitTracker
 * Consultation et ajout manuel d'entrées dans l'historique
 * des séances réalisées par l'utilisateur.
 */

const Historique = require('../models/Historique');

/**
 * Récupère l'historique de l'utilisateur avec filtre optionnel par période.
 * @route GET /api/historique
 * @query {string} dateDebut - Date de début (ISO) pour filtrer les séances
 * @query {string} dateFin - Date de fin (ISO) pour filtrer les séances
 * @returns {Array} Entrées d'historique avec séances et exercices peuplés
 */
async function getHistorique(req, res) {
  try {
    const filtre = { utilisateur_id: req.utilisateur.id };

    // Filtre optionnel par période (paramètres query ?dateDebut=&dateFin=)
    if (req.query.dateDebut || req.query.dateFin) {
      filtre.dateRealisation = {};
      if (req.query.dateDebut) {
        filtre.dateRealisation.$gte = new Date(req.query.dateDebut);
      }
      if (req.query.dateFin) {
        filtre.dateRealisation.$lte = new Date(req.query.dateFin);
      }
    }

    // Chargement avec peuplement des références séance et exercices
    const entrees = await Historique
      .find(filtre)
      .populate('seance_id', 'nom')
      .populate('exercicesRealises.exercice_id', 'nom muscleCible')
      .sort({ dateRealisation: -1 });

    return res.status(200).json({ success: true, data: entrees });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Ajoute manuellement une entrée dans l'historique.
 * Usage optionnel pour les entrées hors séance programmée.
 * @route POST /api/historique
 * @returns {Object} Entrée d'historique créée
 */
async function createHistorique(req, res) {
  try {
    const entree = await Historique.create({
      ...req.body,
      utilisateur_id: req.utilisateur.id
    });
    return res.status(201).json({ success: true, data: entree });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = { getHistorique, createHistorique };
