// Modèle Programme : plan d'entraînement regroupant plusieurs séances sur une période donnée
const mongoose = require('mongoose');

const programmeSchema = new mongoose.Schema({
  utilisateur_id: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'Utilisateur',
    required: [true, "L'utilisateur est requis"],
  },
  nom: {
    type    : String,
    required: [true, 'Le nom du programme est requis'],
    trim    : true,
  },
  description: {
    type   : String,
    trim   : true,
    default: '',
  },
  dateDebut: {
    type: Date,
  },
  dateFin: {
    type: Date,
  },
  seances_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref : 'Seance', // références vers les séances incluses dans le programme
  }],
}, { timestamps: true });

module.exports = mongoose.model('Programme', programmeSchema);
