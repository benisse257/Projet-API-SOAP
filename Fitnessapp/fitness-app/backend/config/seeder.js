require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const connectDB = require('./db');
const User         = require('../models/Utilisateur');
const Exercice     = require('../models/Exercice');
const Seance       = require('../models/Seance');
const DetailSeance = require('../models/DetailSeance');
const Historique   = require('../models/Historique');
const Objectif     = require('../models/Objectif');

const peupler = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Exercice.deleteMany();
    await Seance.deleteMany();
    await DetailSeance.deleteMany();
    await Historique.deleteMany();
    await Objectif.deleteMany();
    console.log('Collections videes');
    const u1 = new User({ nom: 'Admin', email: 'admin@fittracker.com', motDePasse: 'admin123', role: 'admin', age: 30, poids: 80, taille: 180, objectif_principal: 'Maintien' });
    const u2 = new User({ nom: 'Jean',  email: 'jean@gmail.com',       motDePasse: 'jean1234', role: 'user',  age: 25, poids: 75, taille: 178, objectif_principal: 'Prise de masse' });
    const u3 = new User({ nom: 'Marie', email: 'marie@gmail.com',      motDePasse: 'marie1234',role: 'user',  age: 28, poids: 60, taille: 165, objectif_principal: 'Perte de poids' });
    await u1.save(); await u2.save(); await u3.save();
    console.log('3 users OK');
    const exos = await Exercice.insertMany([
      { nom: 'Developpe couche', categorie: 'musculation', niveauDifficulte: 'intermediaire', muscles: ['pectoraux'], description: 'Pectoraux', creePar: u1._id },
      { nom: 'Squat',            categorie: 'musculation', niveauDifficulte: 'intermediaire', muscles: ['jambes'],    description: 'Jambes',    creePar: u1._id },
      { nom: 'Tractions',        categorie: 'musculation', niveauDifficulte: 'avance',        muscles: ['dorsaux'],   description: 'Dos',       creePar: u1._id },
      { nom: 'Curl biceps',      categorie: 'musculation', niveauDifficulte: 'debutant',      muscles: ['biceps'],    description: 'Biceps',    creePar: u1._id },
      { nom: 'Pompes',           categorie: 'musculation', niveauDifficulte: 'debutant',      muscles: ['pectoraux'], description: 'Corps',     creePar: u1._id },
      { nom: 'Souleve de terre', categorie: 'musculation', niveauDifficulte: 'avance',        muscles: ['dorsaux'],   description: 'Complet',   creePar: u1._id },
      { nom: 'Course a pied',    categorie: 'cardio',      niveauDifficulte: 'debutant',      muscles: ['jambes'],    description: 'Cardio',    creePar: u1._id },
      { nom: 'Corde a sauter',   categorie: 'cardio',      niveauDifficulte: 'intermediaire', muscles: ['mollets'],   description: 'Cardio',    creePar: u1._id },
      { nom: 'Burpees',          categorie: 'cardio',      niveauDifficulte: 'avance',        muscles: ['complet'],   description: 'Explosif',  creePar: u1._id },
      { nom: 'Etirement ischio', categorie: 'flexibilite', niveauDifficulte: 'debutant',      muscles: ['ischio'],    description: 'Etirement', creePar: u1._id },
      { nom: 'Yoga',             categorie: 'flexibilite', niveauDifficulte: 'debutant',      muscles: ['dos'],       description: 'Yoga',      creePar: u1._id },
    ]);
    console.log(exos.length + ' exercices OK');
    const s1 = await Seance.create({ utilisateur: u2._id, nom: 'Full Body',    description: 'Seance complete', dureeEstimee: 45, estPublique: true  });
    const s2 = await Seance.create({ utilisateur: u2._id, nom: 'Haut du corps',description: 'Haut du corps',   dureeEstimee: 40, estPublique: false });
    const s3 = await Seance.create({ utilisateur: u3._id, nom: 'Cardio',       description: 'Cardio intense',  dureeEstimee: 30, estPublique: true  });
    console.log('3 seances OK');
    await DetailSeance.insertMany([
      { seance: s1._id, exercice: exos[4]._id, ordre: 1, series: 3, repetitions: 15, poidsKg: 0,  reposSecondes: 60  },
      { seance: s1._id, exercice: exos[1]._id, ordre: 2, series: 4, repetitions: 12, poidsKg: 40, reposSecondes: 90  },
      { seance: s1._id, exercice: exos[0]._id, ordre: 3, series: 3, repetitions: 10, poidsKg: 50, reposSecondes: 90  },
      { seance: s1._id, exercice: exos[3]._id, ordre: 4, series: 3, repetitions: 12, poidsKg: 10, reposSecondes: 60  },
      { seance: s2._id, exercice: exos[0]._id, ordre: 1, series: 4, repetitions: 8,  poidsKg: 60, reposSecondes: 120 },
      { seance: s2._id, exercice: exos[3]._id, ordre: 2, series: 4, repetitions: 10, poidsKg: 12, reposSecondes: 60  },
      { seance: s3._id, exercice: exos[6]._id, ordre: 1, series: 1, dureeSecondes: 1200, poidsKg: 0, reposSecondes: 0  },
      { seance: s3._id, exercice: exos[7]._id, ordre: 2, series: 5, dureeSecondes: 60,   poidsKg: 0, reposSecondes: 30 },
    ]);
    console.log('8 details OK');
    const d = (n) => new Date(Date.now() - n * 86400000);
    await Historique.insertMany([
      { utilisateur: u2._id, seance: s1._id, dateEntrainement: d(1), dureeReelle: 48, calories: 320, ressenti: 'moyen',    notes: 'Bonne seance' },
      { utilisateur: u2._id, seance: s1._id, dateEntrainement: d(4), dureeReelle: 50, calories: 340, ressenti: 'difficile', notes: 'Charges augmentees' },
      { utilisateur: u2._id, seance: s2._id, dateEntrainement: d(6), dureeReelle: 42, calories: 280, ressenti: 'facile',    notes: '' },
      { utilisateur: u3._id, seance: s3._id, dateEntrainement: d(2), dureeReelle: 32, calories: 400, ressenti: 'difficile', notes: 'Bonne sudation' },
      { utilisateur: u3._id, seance: s3._id, dateEntrainement: d(5), dureeReelle: 30, calories: 370, ressenti: 'moyen',     notes: '' },
    ]);
    console.log('5 historiques OK');
    await Objectif.insertMany([
      { utilisateur: u2._id, titre: '3 seances semaine',  type: 'seances_par_semaine', valeurCible: 3,   valeurActuelle: 2,   statut: 'en_cours' },
      { utilisateur: u2._id, titre: 'Bench press 80 kg',  type: 'performance',         valeurCible: 80,  valeurActuelle: 60,  statut: 'en_cours' },
      { utilisateur: u3._id, titre: 'Perdre 5 kg',        type: 'poids',               valeurCible: 55,  valeurActuelle: 60,  statut: 'en_cours' },
      { utilisateur: u3._id, titre: 'Bruler 400 cal',     type: 'calories',            valeurCible: 400, valeurActuelle: 370, statut: 'en_cours' },
    ]);
    console.log('4 objectifs OK');
    console.log('SEED TERMINE !');
    console.log('admin@fittracker.com / admin123');
    console.log('jean@gmail.com / jean1234');
    console.log('marie@gmail.com / marie1234');
    process.exit(0);
  } catch (err) {
    console.error('ERREUR:', err.message);
    process.exit(1);
  }
};
peupler();
