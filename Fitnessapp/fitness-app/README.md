# 💪 FitTracker - Application de Suivi de Fitness

**Projet 3 : Développement JavaScript & Bases de Données NoSQL**

---

## 🚀 DÉMARRAGE RAPIDE

### Installation (5 minutes)

```bash
# 1. Cloner/Ouvrir le projet
cd fitness-app

# 2. Installer les dépendances
npm install

# 3. Configurer MongoDB (si local)
# Assurer que MongoDB est en cours d'exécution

# 4. Créer le fichier .env
# Ajouter :
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/fitness-app
# JWT_SECRET=votre_secret_tres_securise

# 5. Lancer le serveur
npm run dev

# 6. Ouvrir le navigateur
# http://localhost:5000
```

---

## 📁 STRUCTURE DU PROJET

```
fitness-app/
├── backend/
│   ├── controllers/     # Logique métier
│   ├── models/         # Schémas MongoDB
│   ├── routes/         # Routes API
│   ├── middleware/     # Authentification, etc.
│   ├── utils/          # Validations, réponses
│   ├── config/         # Database config
│   └── server.js       # Serveur Express
├── frontend/
│   ├── pages/         # Pages HTML
│   ├── css/           # Styling
│   └── js/            # Logique frontend
├── RAPPORT_ACADEMIQUE.txt
├── GUIDE_*.md
└── package.json
```

---

## 🔧 COMMANDES UTILES

```bash
# Démarrer le serveur
npm run dev

# Lancer une seule fois
npm start

# Lancer le seeder (charger données initiales)
npm run seed

# Tests avec Postman
# Voir : GUIDE_TESTS_POSTMAN.md
```

---

## 📚 DOCUMENTATION

| Document | Description |
|----------|-------------|
| `RAPPORT_ACADEMIQUE.txt` | Rapport complet (25+ pages) |
| `GUIDE_TESTS_POSTMAN.md` | Documentation complète des APIs |
| `GUIDE_AMELIORATIONS_FRONTEND.md` | Instructions pour améliorer l'UI |
| `PLAN_TRAVAIL.md` | Planning détaillé |
| `RESUME_AMELIORATIONS.md` | Résumé des améliorations |

---

## 🔐 AUTHENTIFICATION

### Créer un compte
```
http://localhost:5000
→ Formulaire inscription
→ Email & mot de passe
```

### Se connecter
```
Email: votre@email.com
Mot de passe: VotreMotDePasse123
```

---

## 🎯 FONCTIONNALITÉS PRINCIPALES

### ✅ Complètement implémentées
- 🔒 Authentification sécurisée (JWT + bcrypt)
- 📝 Gestion des exercices (CRUD, filtres)
- 📅 Gestion des séances personnalisées
- 📊 Historique des entraînements
- 🎯 Suivi des objectifs
- 📈 Statistiques hebdomadaires (agrégations)
- 🏋️ Exercices les plus pratiqués

### 🟡 À améliorer (frontend)
- 📊 Graphiques Chart.js sur le dashboard
- 🎨 Design plus moderne
- 📱 Responsive complètement
- ✅ Validation client côté formulaires
- 🔄 Spinners de chargement

---

## 🧪 TESTER L'APPLICATION

### Option 1 : Interface Web
1. Aller sur `http://localhost:5000`
2. S'inscrire
3. Créer une séance
4. Ajouter des exercices
5. Enregistrer un entraînement

### Option 2 : Postman (API)
1. Importer les requêtes depuis `GUIDE_TESTS_POSTMAN.md`
2. Remplacer les variables (token, URLs)
3. Exécuter les tests

### Option 3 : curl (ligne de commande)
```bash
# Inscription
curl -X POST http://localhost:5000/api/auth/inscription \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","email":"test@test.com","motDePasse":"Test123"}'

# Connexion
curl -X POST http://localhost:5000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","motDePasse":"Test123"}'
```

---

## 🔍 TROUBLESHOOTING

### Erreur : Port 5000 déjà utilisé
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F

# macOS/Linux
lsof -i :5000
kill -9 [PID]
```

### Erreur : MongoDB non connectée
```bash
# Vérifier MongoDB
mongod
# Ou utiliser MongoDB Atlas (cloud)
# MONGO_URI=mongodb+srv://user:pass@...
```

### Erreur : "Cannot GET /dashboard"
- Vérifier que le serveur tourne : `npm run dev`
- Vérifier les routes dans `backend/server.js`

---

## 📊 ARCHITECTURE TECHNIQUE

```
┌─────────────────────────┐
│   Frontend (HTML/CSS/JS) │
│  Pages : Accueil, Login  │
│  Dashboard, Exercices    │
└────────────┬─────────────┘
             │ HTTP/REST
┌────────────▼──────────────┐
│  Backend (Node/Express)   │
│  APIs: /api/auth          │
│        /api/seances       │
│        /api/exercices     │
│        /api/historique    │
└────────────┬──────────────┘
             │ Mongoose
┌────────────▼──────────────┐
│   MongoDB (6 collections) │
│   Users, Seances, Exos... │
└───────────────────────────┘
```

---

## 📋 DONNÉES INITIALES

Si vous voulez charger des exercices par défaut :

```bash
npm run seed
```

Cela crée :
- Utilisateur admin
- 30+ exercices (musculation, cardio, etc.)
- Données de test

---

## 🎓 POUR LA SOUTENANCE

Voir : `RESUME_AMELIORATIONS.md`

**Éléments clés à expliquer :**
1. Architecture 3-tiers
2. Modélisation NoSQL (6 collections)
3. Authentification JWT + Bcrypt
4. Agrégations MongoDB
5. Tests effectués

---

## 📞 RESSOURCES

- **Express** : https://expressjs.com/
- **MongoDB** : https://docs.mongodb.com/
- **Mongoose** : https://mongoosejs.com/
- **JWT** : https://jwt.io/
- **Chart.js** : https://www.chartjs.org/

---

## 👥 ÉQUIPE

| Rôle | Nom |
|------|-----|
| Backend | [À remplir] |
| Frontend | [À remplir] |
| Database | [À remplir] |
| Documentation | [À remplir] |

---

## 📅 DATES IMPORTANTES

- **Début du projet** : 8 Juin 2026
- **Fin du projet** : 21 Juin 2026
- **Remise** : Code + Rapport + Git
- **Soutenance** : [À définir]

---

## ✅ CHECKLIST AVANT REMISE

- [ ] Serveur démarre sans erreur
- [ ] Frontend accessible sur http://localhost:5000
- [ ] Authentification fonctionne
- [ ] CRUD complet pour toutes les ressources
- [ ] APIs testées (Postman)
- [ ] Rapport académique complétée
- [ ] Code committé sur Git
- [ ] README fourni
- [ ] .env configuré (ou .env.example)

---

## 🏆 BONNE CHANCE ! 🎓

**FitTracker v1.0 est prêt pour la soutenance.**

Pour des questions, consulter les guides :
- Questions techniques → `GUIDE_TESTS_POSTMAN.md`
- Améliorations UI → `GUIDE_AMELIORATIONS_FRONTEND.md`
- Rapport → `RAPPORT_ACADEMIQUE.txt`

---

**Happy Coding! 💻🚀**
