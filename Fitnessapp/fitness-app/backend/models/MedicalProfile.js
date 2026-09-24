// Modèle MedicalProfile : profil médical d'un utilisateur, synchronisé depuis
// le serveur SOAP legacy-medical-api (Spring Boot). Un seul profil par utilisateur.
const mongoose = require('mongoose');

const medicalProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, "L'utilisateur est obligatoire"],
    unique: true // un seul profil médical par utilisateur (clé de l'upsert)
  },
  patientExternalId: {
    type: String,
    required: [true, "L'identifiant externe du patient est obligatoire"]
  },
  maxHeartRate: {
    type: Number,
    required: [true, 'Le rythme cardiaque maximal est obligatoire']
  },
  jointRestrictions: [
    {
      bodyPart: { type: String, trim: true },
      restrictionType: {
        type: String,
        enum: ['AVOID_IMPACT', 'NO_HEAVY_LIFTING'] // valeurs exactes du contrat SOAP
      }
    }
  ],
  allowedExercises: {
    type: [String], // identifiants des exercices autorisés (contrat SOAP)
    default: []
  },
  clearanceExpiryDate: {
    type: Date,
    required: [true, "La date de validité du clearance est obligatoire"]
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now // dernière synchronisation réussie avec Spring Boot
  }
}, { timestamps: true });

module.exports = mongoose.models.MedicalProfile || mongoose.model('MedicalProfile', medicalProfileSchema, 'medicalprofiles');