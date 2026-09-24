/**
 * Script de peuplement de la base de données (seeder)
 * Insère des données de test : utilisateurs, exercices, séances et objectifs
 * À exécuter avec : node config/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');

// Import des modèles Mongoose
const User = require('../models/Utilisateur');
const Exercice = require('../models/Exercice');
const Seance = require('../models/Seance');
const Objectif = require('../models/Objectif');

/**
 * Fonction principale de seeding
 * Connecte à la DB, supprime les anciennes données et insère les nouvelles
 */
const seed = async () => {
  try {
    await connectDB();

    // Étape 1 : Suppression des anciennes données
    console.log("Suppression des anciennes données...");

    await User.deleteMany({});
    await Exercice.deleteMany({});
    await Seance.deleteMany({});
    await Objectif.deleteMany({});

    // Étape 2 : Insertion des utilisateurs
    console.log("Insertion des utilisateurs...");

    // Utilisation de save() pour déclencher le hook pre('save')
    const alice = new User({
      nom: 'Alice Martin',
      email: 'alice@example.com',
      motDePasse: 'Password123',
      role: 'sportif',
      age: 29,
      poids: 62,
      taille: 168,
      objectif_principal: 'Perte de poids'
    });

    await alice.save();

    const bob = new User({
      nom: 'Bob Durand',
      email: 'bob@example.com',
      motDePasse: 'Password123',
      role: 'admin',
      age: 35,
      poids: 80,
      taille: 182,
      objectif_principal: 'Prise de masse'
    });

    await bob.save();

    // Étape 3 : Insertion des exercices
    console.log("Insertion des exercices...");

    await Exercice.insertMany([
      {
        nom: 'Squat',
        description: 'Exercice de base pour les jambes',
        categorie: 'musculation',
        niveauDifficulte: 'intermediaire',
        muscles: ['quadriceps', 'fessiers'],
        creePar: alice._id
      },
      {
        nom: 'Course rapide',
        description: 'Cardio intensif sur tapis',
        categorie: 'cardio',
        niveauDifficulte: 'debutant',
        muscles: ['jambes', 'cardio'],
        creePar: bob._id
      },
      {
        nom: 'Étirement du bas du dos',
        description: 'Séance de mobilité simple',
        categorie: 'flexibilite',
        niveauDifficulte: 'debutant',
        muscles: ['dos', 'ischios'],
        creePar: alice._id
      }
    ]);

    // Étape 4 : Insertion des séances d'entraînement
    console.log("Insertion des séances...");

    await Seance.insertMany([
      {
        utilisateur: alice._id,
        nom: 'Séance full body',
        description: 'Routine complète pour débuter la semaine',
        dureeEstimee: 45,
        estPublique: true
      },
      {
        utilisateur: bob._id,
        nom: 'Cardio du matin',
        description: 'Course et mobilité',
        dureeEstimee: 30,
        estPublique: false
      }
    ]);

    // Étape 5 : Insertion des objectifs personnels
    console.log("Insertion des objectifs...");

    await Objectif.insertMany([
      {
        utilisateur: alice._id,
        titre: 'Perdre 3 kg',
        type: 'poids',
        valeurCible: 59,
        valeurActuelle: 62,
        dateEcheance: new Date('2026-09-01'),
        statut: 'en_cours'
      },
      {
        utilisateur: bob._id,
        titre: '3 séances par semaine',
        type: 'seances_par_semaine',
        valeurCible: 3,
        valeurActuelle: 2,
        statut: 'en_cours'
      }
    ]);

    console.log("==================================");
    console.log("Seed terminé avec succès !");
    console.log("Utilisateurs créés : 2");
    console.log("Exercices créés : 3");
    console.log("Séances créées : 2");
    console.log("Objectifs créés : 2");
    console.log("==================================");

    process.exit(0);

  } catch (error) {
    console.error("Erreur lors du seed :", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seed();