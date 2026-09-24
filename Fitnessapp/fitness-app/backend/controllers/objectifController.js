/**
 * Contrôleur des objectifs — FitTracker
 * Gestion des objectifs fitness avec calcul automatique
 * de la progression et du statut (en cours / atteint / abandonné).
 */

const Objectif = require('../models/Objectif');

/**
 * Applique les règles de calcul de progression et de statut d'un objectif.
 * - Progression : pourcentage de la valeur actuelle par rapport à la cible.
 * - Statut : 'atteint' si ≥ 100 %, 'abandonné' si date dépassée, sinon 'en_cours'.
 * @param {number} valeurActuelle - Valeur actuelle de progression
 * @param {number} valeurCible - Objectif cible
 * @param {string|Date} dateEcheance - Date limite de l'objectif
 * @returns {Object} { progression: number, statut: string }
 */
function appliquerRegles(valeurActuelle, valeurCible, dateEcheance) {
  const objectif = valeurCible || 0;
  // Calcul du pourcentage de progression
  const progression = objectif > 0 ? Math.round((valeurActuelle / objectif) * 100) : 0;

  // Détermination du statut
  let statut;
  if (objectif > 0 && progression >= 100) {
    statut = 'atteint';
  } else if (dateEcheance && new Date(dateEcheance) < new Date()) {
    statut = 'abandonné';
  } else {
    statut = 'en_cours';
  }

  return { progression, statut };
}

/**
 * Liste les objectifs de l'utilisateur avec mise à jour automatique
 * de la progression et du statut pour chaque objectif.
 * @route GET /api/objectifs
 * @returns {Array} Liste des objectifs mis à jour
 */
exports.listerObjectifs = async (req, res) => {
  try {
    const objectifs = await Objectif.find({ utilisateur: req.utilisateur.id }).sort({ createdAt: -1 });

    // Recalculer et sauvegarder la progression pour chaque objectif
    const misesAJour = await Promise.all(objectifs.map(async (o) => {
      const { progression, statut } = appliquerRegles(o.valeurActuelle, o.valeurCible, o.dateEcheance);
      if (progression !== o.progression || statut !== o.statut) {
        o.progression = progression;
        o.statut = statut;
        await o.save();
      }
      return o;
    }));

    res.json(misesAJour);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Crée un nouvel objectif pour l'utilisateur connecté.
 * La progression et le statut sont calculés à la création.
 * @route POST /api/objectifs
 * @returns {Object} Objectif créé avec progression calculée
 */
exports.creerObjectif = async (req, res) => {
  try {
    const { titre, type, valeurCible, valeurActuelle, dateEcheance } = req.body;
    // Calcul initial de la progression
    const { progression, statut } = appliquerRegles(valeurActuelle || 0, valeurCible, dateEcheance);

    const objectif = await Objectif.create({
      utilisateur: req.utilisateur.id,
      titre,
      type,
      valeurCible,
      valeurActuelle: valeurActuelle || 0,
      progression,
      dateEcheance: dateEcheance || null,
      statut
    });

    res.status(201).json(objectif);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Modifie un objectif existant et recalcule la progression.
 * @route PUT /api/objectifs/:id
 * @param {string} id - Identifiant de l'objectif
 * @returns {Object} Objectif mis à jour
 */
exports.modifierObjectif = async (req, res) => {
  try {
    const objectif = await Objectif.findOne({ _id: req.params.id, utilisateur: req.utilisateur.id });
    if (!objectif) return res.status(404).json({ message: 'Objectif non trouve' });

    // Mise à jour sélective des champs
    if (req.body.titre !== undefined)        objectif.titre = req.body.titre;
    if (req.body.type !== undefined)         objectif.type = req.body.type;
    if (req.body.valeurCible !== undefined)  objectif.valeurCible = req.body.valeurCible;
    if (req.body.valeurActuelle !== undefined) objectif.valeurActuelle = req.body.valeurActuelle;
    if (req.body.dateEcheance !== undefined) objectif.dateEcheance = req.body.dateEcheance;

    // Recalcul après modification
    const { progression, statut } = appliquerRegles(objectif.valeurActuelle, objectif.valeurCible, objectif.dateEcheance);
    objectif.progression = progression;
    objectif.statut = statut;

    await objectif.save();
    res.json(objectif);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Supprime un objectif de l'utilisateur.
 * @route DELETE /api/objectifs/:id
 * @param {string} id - Identifiant de l'objectif
 */
exports.supprimerObjectif = async (req, res) => {
  try {
    await Objectif.findOneAndDelete({ _id: req.params.id, utilisateur: req.utilisateur.id });
    res.json({ message: 'Objectif supprime' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
