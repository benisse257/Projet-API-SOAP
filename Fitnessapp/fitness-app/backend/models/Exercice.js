// Modèle Exercice : définit un exercice avec sa catégorie, son niveau de difficulté et les muscles ciblés
const mongoose = require('mongoose');

const exerciceSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Le nom de l'exercice est obligatoire"],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  categorie: {
    type: String,
    enum: ['musculation', 'cardio', 'flexibilite', 'equilibre'],
    required: [true, 'La catégorie est obligatoire']
  },
  niveauDifficulte: {
    type: String,
    enum: ['debutant', 'intermediaire', 'avance'], // niveau requis pour pratiquer l'exercice
    default: 'debutant'
  },
  muscles: {
    type: [String], // liste des muscles sollicités par l'exercice
    default: []
  },
  codeExterne: {
    type: String, // identifiant EXxxx partagé avec le système médical legacy (allowedExercises SOAP)
    trim: true,
    default: null
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Exercice', exerciceSchema);