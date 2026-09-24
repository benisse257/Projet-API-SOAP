// Modèle Categorie : regroupe les exercices par type (musculation, cardio, etc.)
const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la catégorie est obligatoire'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Categorie', categorieSchema);
