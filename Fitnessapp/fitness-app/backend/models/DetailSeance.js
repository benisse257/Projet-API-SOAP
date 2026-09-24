// Modèle DetailSeance : associe un exercice à une séance avec les paramètres d'exécution (séries, reps, poids)
const mongoose = require('mongoose');

const detailSeanceSchema = new mongoose.Schema({
  seance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seance',
    required: [true, 'La séance est obligatoire']
  },
  exercice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercice',
    required: [true, "L'exercice est obligatoire"]
  },
  ordre: {
    type: Number, // position de l'exercice dans la séance (1, 2, 3...)
    default: 1
  },
  series: {
    type: Number,
    default: 3
  },
  repetitions: {
    type: Number, // null si exercice cardio (utiliser dureeSecondes à la place)
    default: null
  },
  dureeSecondes: {
    type: Number, // null si exercice de force (utiliser repetitions à la place)
    default: null
  },
  poidsKg: {
    type: Number, // poids utilisé en kilogrammes (0 = poids du corps)
    default: 0
  },
  reposSecondes: {
    type: Number, // temps de repos entre les séries, en secondes
    default: 60
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

// Index composé : retrouver rapidement les exercices d'une séance, triés par ordre
detailSeanceSchema.index({ seance: 1, ordre: 1 });

module.exports = mongoose.model('DetailSeance', detailSeanceSchema);