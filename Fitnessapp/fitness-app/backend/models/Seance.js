// Modèle Seance : représente une séance d'entraînement créée par un utilisateur
const mongoose = require('mongoose');

const seanceSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, "L'utilisateur est obligatoire"]
  },
  nom: {
    type: String,
    required: [true, 'Le nom de la séance est obligatoire'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dureeEstimee: {
    type: Number, // en minutes
    default: 0
  },
  estPublique: {
    type: Boolean,
    default: false // false = visible uniquement par son créateur
  },
  statut: {
    type: String,
    enum: ['planifiee', 'en_cours', 'realisee'],
    default: 'planifiee'
  }
}, { timestamps: true });

module.exports = mongoose.model('Seance', seanceSchema);