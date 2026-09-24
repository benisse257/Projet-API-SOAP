/**
 * Point d'entrée principal du serveur FitTracker
 * Configure Express, les routes API et le service des fichiers du frontend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');

// Import des routes API
const exerciceRoutes = require('./routes/exerciceRoutes');
const seanceRoutes = require('./routes/seanceRoutes');
const objectifRoutes = require('./routes/objectifRoutes');
const historiqueRoutes = require('./routes/historiqueRoutes');

// --- Définition des routes API à charger dynamiquement ---
const routeDefinitions = [
  ['/api/auth', './routes/authRoutes'],
  ['/api/users', './routes/userRoutes'],
  ['/api/categories', './routes/categorieRoutes'],
  ['/api/exercices', './routes/exerciceRoutes'],
  ['/api/seances', './routes/seanceRoutes'],
  ['/api/programmes', './routes/programmeRoutes'],
  ['/api/objectifs', './routes/objectifRoutes'],
  ['/api/historique', './routes/historiqueRoutes'],
  ['/api/stats', './routes/statsRoutes'],
  ['/api/medical', './routes/medicalRoutes']
];

// --- Initialisation de l'application Express ---
const app = express();
connectDB();

// Configuration des middleware globaux
app.use(cors());
app.use(express.json());

// --- Service des fichiers statiques du frontend ---
const frontendRoot = path.join(__dirname, '../frontend');

/**
 * Helper pour servir une page HTML depuis le dossier frontend
 * @param {string} route - Chemin de la route HTTP
 * @param {string} file - Chemin relatif du fichier HTML
 */
const servePage = (route, file) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(frontendRoot, file));
  });
};

// --- Routes HTML du frontend ---
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'pages/accueil.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'pages/accueil.html'));
});
servePage('/login', 'pages/login.html');
servePage('/login.html', 'pages/login.html');
servePage('/register', 'pages/register.html');
servePage('/register.html', 'pages/register.html');
servePage('/accueil', 'pages/accueil.html');
servePage('/accueil.html', 'pages/accueil.html');
servePage('/admin-dashboard', 'pages/admin-dashboard.html');
servePage('/admin-dashboard.html', 'pages/admin-dashboard.html');
servePage('/dashboard', 'pages/dashboard.html');
servePage('/dashboard.html', 'pages/dashboard.html');
app.get('/pages/pages/dashboard.html', (req, res) => {
  res.redirect('/dashboard');
});
app.get('/pages/pages/index.html', (req, res) => {
  res.redirect('/');
});
servePage('/exercices', 'pages/exercices.html');
servePage('/exercices.html', 'pages/exercices.html');
servePage('/seances', 'pages/seances.html');
servePage('/seances.html', 'pages/seances.html');
servePage('/historique', 'pages/historique.html');
servePage('/historique.html', 'pages/historique.html');
servePage('/objectifs', 'pages/objectifs.html');
servePage('/objectifs.html', 'pages/objectifs.html');
servePage('/categories', 'pages/categories.html');
servePage('/categories.html', 'pages/categories.html');
servePage('/users', 'pages/users.html');
servePage('/users.html', 'pages/users.html');
servePage('/programmes', 'pages/programmes.html');
servePage('/programmes.html', 'pages/programmes.html');

// Service des fichiers statiques (CSS, JS, images)
app.use(express.static(frontendRoot));

// --- Chargement dynamique des routes API ---
// Routes API
for (const [pathName, routePath] of routeDefinitions) {
  try {
    const route = require(routePath);
    app.use(pathName, route);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(routePath)) {
      console.warn(`Route module not found: ${routePath}`);
      continue;
    }
    throw error;
  }
}

// Middleware global d'erreurs
app.use(errorMiddleware);

// --- Démarrage du serveur ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});