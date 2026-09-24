/**
 * Contrôleur des statistiques — FitTracker
 * Fournit les statistiques personnelles de l'utilisateur (progression,
 * volume d'entraînement, comparaisons hebdomadaires/mensuelles)
 * ainsi que les statistiques globales de la plateforme.
 */

const Seance = require('../models/Seance');
const Historique = require('../models/Historique');
const Utilisateur = require('../models/Utilisateur');
const Exercice = require('../models/Exercice');
const Categorie = require('../models/Categorie');
const Programme = require('../models/Programme');
const Objectif = require('../models/Objectif');
const mongoose = require('mongoose');

/**
 * Récupère les statistiques personnelles détaillées d'un utilisateur.
 * Inclut : nombre total de séances, volume total soulevé,
 * progression hebdomadaire/mensuelle et comparaison avec la période précédente.
 * @route GET /api/stats/personnelles
 * @returns {Object} Statistiques personnelles complètes
 */
async function getStatsPersonnelles(req, res) {
  try {
    const userId = new mongoose.Types.ObjectId(req.utilisateur.id);

    // Nombre total de séances réalisées
    const nombreSeances = await Seance.countDocuments({
      utilisateur: userId,
      statut: 'realisee'
    });

    // Volume total soulevé : somme(poids × séries × répétitions) sur tous les historiques
    const volumeResult = await Historique.aggregate([
      { $match: { utilisateur_id: userId } },
      { $unwind: '$exercicesRealises' },
      {
        $group: {
          _id: null,
          volumeTotal: {
            $sum: {
              $multiply: [
                '$exercicesRealises.poidsUtilise',
                '$exercicesRealises.seriesRealisees',
                '$exercicesRealises.repetitionsRealisees'
              ]
            }
          }
        }
      }
    ]);
    const volumeTotal = volumeResult[0]?.volumeTotal || 0;

    // Progression groupée par semaine (séances, durée, calories)
    const progressionParSemaine = await Historique.aggregate([
      { $match: { utilisateur_id: userId } },
      {
        $group: {
          _id: {
            annee: { $isoWeekYear: '$dateRealisation' },
            semaine: { $isoWeek: '$dateRealisation' }
          },
          nombreSeances: { $sum: 1 },
          dureeTotale:   { $sum: { $ifNull: ['$dureeTotale', 0] } },
          caloriesTotales: { $sum: { $ifNull: ['$caloriesEstimees', 0] } }
        }
      },
      { $sort: { '_id.annee': 1, '_id.semaine': 1 } },
      {
        $project: {
          _id: 0,
          semaine: {
            $concat: [
              'S',
              { $toString: '$_id.semaine' },
              ' ',
              { $toString: '$_id.annee' }
            ]
          },
          nombreSeances: 1,
          dureeTotale: 1,
          caloriesTotales: 1
        }
      }
    ]);

    // Progression groupée par mois
    const progressionParMois = await Historique.aggregate([
      { $match: { utilisateur_id: userId } },
      {
        $group: {
          _id: {
            annee: { $year: '$dateRealisation' },
            mois: { $month: '$dateRealisation' }
          },
          nombreSeances: { $sum: 1 },
          dureeTotale:   { $sum: { $ifNull: ['$dureeTotale', 0] } },
          caloriesTotales: { $sum: { $ifNull: ['$caloriesEstimees', 0] } }
        }
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1 } },
      {
        $project: {
          _id: 0,
          mois: {
            $concat: [
              { $toString: '$_id.mois' },
              '/',
              { $toString: '$_id.annee' }
            ]
          },
          nombreSeances: 1,
          dureeTotale: 1,
          caloriesTotales: 1
        }
      }
    ]);

    // Calcul des bornes temporelles pour les comparaisons
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Agrégations parallèles pour les comparaisons semaine/mois en cours vs précédent
    const [thisWeekData, prevWeekData, thisMonthData, prevMonthData] = await Promise.all([
      Historique.aggregate([
        { $match: { utilisateur_id: userId, dateRealisation: { $gte: startOfWeek } } },
        {
          $group: {
            _id: null,
            seances: { $sum: 1 },
            duree:   { $sum: { $ifNull: ['$dureeTotale', 0] } },
            calories:{ $sum: { $ifNull: ['$caloriesEstimees', 0] } }
          }
        }
      ]),
      Historique.aggregate([
        { $match: { utilisateur_id: userId, dateRealisation: { $gte: startOfPrevWeek, $lt: startOfWeek } } },
        {
          $group: {
            _id: null,
            seances: { $sum: 1 },
            duree:   { $sum: { $ifNull: ['$dureeTotale', 0] } },
            calories:{ $sum: { $ifNull: ['$caloriesEstimees', 0] } }
          }
        }
      ]),
      Historique.aggregate([
        { $match: { utilisateur_id: userId, dateRealisation: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            seances: { $sum: 1 },
            duree:   { $sum: { $ifNull: ['$dureeTotale', 0] } },
            calories:{ $sum: { $ifNull: ['$caloriesEstimees', 0] } }
          }
        }
      ]),
      Historique.aggregate([
        { $match: { utilisateur_id: userId, dateRealisation: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
        {
          $group: {
            _id: null,
            seances: { $sum: 1 },
            duree:   { $sum: { $ifNull: ['$dureeTotale', 0] } },
            calories:{ $sum: { $ifNull: ['$caloriesEstimees', 0] } }
          }
        }
      ])
    ]);

    // Extraction des valeurs avec fallback à 0
    const seanceSemaine    = thisWeekData[0]?.seances ?? 0;
    const dureeSemaine     = thisWeekData[0]?.duree ?? 0;
    const caloriesSemaine  = thisWeekData[0]?.calories ?? 0;
    const seancePrevSem    = prevWeekData[0]?.seances ?? 0;
    const dureePrevSem     = prevWeekData[0]?.duree ?? 0;
    const caloriesPrevSem  = prevWeekData[0]?.calories ?? 0;

    const seanceMois       = thisMonthData[0]?.seances ?? 0;
    const dureeMois        = thisMonthData[0]?.duree ?? 0;
    const caloriesMois     = thisMonthData[0]?.calories ?? 0;
    const seancePrevMois   = prevMonthData[0]?.seances ?? 0;
    const dureePrevMois    = prevMonthData[0]?.duree ?? 0;
    const caloriesPrevMois = prevMonthData[0]?.calories ?? 0;

    return res.status(200).json({
      success: true,
      data: {
        nombreSeances,
        volumeTotal,
        progressionParSemaine,
        progressionParMois,
        semaine: {
          seances:   seanceSemaine,
          duree:     dureeSemaine,
          calories:  caloriesSemaine,
          prevSeances:  seancePrevSem,
          prevDuree:    dureePrevSem,
          prevCalories: caloriesPrevSem
        },
        mois: {
          seances:   seanceMois,
          duree:     dureeMois,
          calories:  caloriesMois,
          prevSeances:  seancePrevMois,
          prevDuree:    dureePrevMois,
          prevCalories: caloriesPrevMois
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Récupère les statistiques globales de la plateforme FitTracker.
 * Inclut les totaux (utilisateurs, séances, exercices, etc.)
 * et le top 5 des exercices les plus utilisés.
 * @route GET /api/stats/globales
 * @returns {Object} Statistiques globales et classement des exercices
 */
async function getStatsGlobales(req, res) {
  try {
    // Compteurs globaux de la plateforme
    const totalUtilisateurs = await Utilisateur.countDocuments();
    const totalSeances = await Seance.countDocuments({ statut: 'realisee' });
    const totalExercices = await Exercice.countDocuments();
    const totalCategories = await Categorie.countDocuments();
    const totalProgrammes = await Programme.countDocuments();
    const totalObjectifs = await Objectif.countDocuments();

    // Top 5 des exercices les plus utilisés dans les séances réalisées
    const exercicesLesPlusUtilises = await Seance.aggregate([
      { $match: { statut: 'realisee' } },
      { $unwind: '$exercices' },
      {
        $group: {
          _id: '$exercices.exercice_id',
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      // Jointure avec la collection exercices pour récupérer le nom
      {
        $lookup: {
          from: 'exercices',
          localField: '_id',
          foreignField: '_id',
          as: 'exercice'
        }
      },
      { $unwind: '$exercice' },
      {
        $project: {
          _id: 0,
          nom: '$exercice.nom',
          total: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUtilisateurs,
        totalSeances,
        totalExercices,
        totalCategories,
        totalProgrammes,
        totalObjectifs,
        exercicesLesPlusUtilises
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getStatsPersonnelles, getStatsGlobales };
