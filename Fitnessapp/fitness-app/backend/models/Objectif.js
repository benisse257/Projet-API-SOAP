// Modèle Objectif : suit les objectifs personnels de l'utilisateur (poids, séances, calories, performance)
const mongoose = require('mongoose');

const objectifSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, "L'utilisateur est obligatoire"]
  },
  titre: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true
  },
  type: {
    type: String,
    enum: ['poids', 'seances_par_semaine', 'calories', 'performance'], // catégorie de l'objectif
    required: [true, 'Le type est obligatoire']
  },
  valeurCible: {
    type: Number,
    required: [true, 'La valeur cible est obligatoire']
  },
  valeurActuelle: {
    type: Number,
    default: 0
  },
  progression: {
    type: Number,
    default: 0
  },
  dateEcheance: {
    type: Date,
    default: null
  },
  statut: {
    type: String,
    enum: ['en_cours', 'atteint', 'abandonné'],
    default: 'en_cours'
  }
}, { timestamps: true });

module.exports = mongoose.model('Objectif', objectifSchema);