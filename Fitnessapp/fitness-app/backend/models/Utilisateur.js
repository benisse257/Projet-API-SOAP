// Modèle Utilisateur : gère les comptes utilisateurs, l'authentification et les données physiques
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true
  },
  email: {
    type: String,
    required: [true, "L'email est obligatoire"],
    unique: true,
    lowercase: true,
    trim: true
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['sportif', 'admin'], // rôle de l'utilisateur dans l'application
    default: 'sportif'
  },
  age:    { type: Number }, // âge en années
  poids:  { type: Number }, // poids en kilogrammes
  taille: { type: Number }, // taille en centimètres
  objectif_principal: { type: String }, // objectif fitness principal (prise de masse, perte de poids, etc.)
  patientExternalId: {
    type: String,
    unique: true,
    sparse: true // permet à plusieurs utilisateurs de ne pas avoir ce champ
  },
  actif: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Hook : hache le mot de passe AVANT de sauvegarder
userSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

// Méthode : compare le mot de passe saisi avec le hash
userSchema.methods.comparerMotDePasse = async function (motDePasseSaisi) {
  return await bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

module.exports = mongoose.models.Utilisateur || mongoose.model('Utilisateur', userSchema, 'utilisateurs');