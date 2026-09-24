// Modèle Historique : journal des séances réalisées avec snapshot des performances
const mongoose = require('mongoose');

const historiqueSchema = new mongoose.Schema({
  utilisateur_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, "L'utilisateur est obligatoire"]
  },
  seance_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seance',
    default: null
  },
  dateRealisation: {
    type: Date,
    default: Date.now
  },
  dureeTotale: {
    type: Number,
    default: 0
  },
  caloriesEstimees: {
    type: Number,
    default: 0
  },
  commentaire: {
    type: String,
    trim: true,
    default: ''
  },
  // Snapshot figé des performances réelles au moment du marquage
  exercicesRealises: [
    {
      exercice_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercice'
      },
      seriesRealisees: Number,
      repetitionsRealisees: Number,
      poidsUtilise: Number,
      dureeReelle: Number
    }
  ]
}, { timestamps: true });

// Index pour accélérer les requêtes par utilisateur et par date
historiqueSchema.index({ utilisateur_id: 1, dateRealisation: -1 });

module.exports = mongoose.model('Historique', historiqueSchema);