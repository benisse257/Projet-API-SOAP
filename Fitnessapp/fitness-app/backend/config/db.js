/**
 * Configuration de la connexion à la base de données MongoDB
 * Utilise Mongoose pour établir et gérer la connexion
 */

const mongoose = require('mongoose');

/**
 * Établit la connexion à MongoDB
 * Utilise la variable d'environnement MONGO_URI ou l'URL locale par défaut
 * En cas d'échec, arrête le processus avec le code d'erreur 1
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-app';
    console.log('Connexion à MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connecté');
  } catch (error) {
    console.error('Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
