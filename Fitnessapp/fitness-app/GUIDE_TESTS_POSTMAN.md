# 🧪 GUIDE DE TESTS API - POSTMAN
## Application FitTracker

**Lien Postman Collection** : [À créer manuellement ou importer ce JSON]

---

## 📌 CONFIGURATION DE BASE

### Variables Postman (à définir une fois)

Créer une "Environment" avec les variables :
```
baseUrl = http://localhost:5000
token = (sera rempli après connexion)
userId = (optionnel, pour tests avancés)
```

### Headers par défaut
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

---

## 🔐 1. AUTHENTIFICATION

### 1.1 Inscription - POST /api/auth/inscription

**URL** : `{{baseUrl}}/api/auth/inscription`

**Method** : POST

**Body** (JSON) :
```json
{
  "nom": "Jean Dupont",
  "email": "jean.dupont@email.com",
  "motDePasse": "Password123",
  "age": 30,
  "poids": 75.5,
  "taille": 180,
  "objectif_principal": "Perdre du poids"
}
```

**Headers** :
```
Content-Type: application/json
```

**Réponse attendue** (201 Created) :
```json
{
  "succes": true,
  "message": "Inscription réussie",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "507f1f77...",
      "nom": "Jean Dupont",
      "email": "jean.dupont@email.com",
      "role": "user"
    }
  }
}
```

**Actions** :
- ✅ Copier le token dans la variable Postman : `{{token}}`
- ✅ Tester avec email invalide → erreur 400
- ✅ Tester avec email déjà existant → erreur 409


### 1.2 Connexion - POST /api/auth/connexion

**URL** : `{{baseUrl}}/api/auth/connexion`

**Method** : POST

**Body** :
```json
{
  "email": "jean.dupont@email.com",
  "motDePasse": "Password123"
}
```

**Réponse attendue** (200 OK) :
```json
{
  "succes": true,
  "message": "Succès",
  "data": {
    "token": "eyJhbGc...",
    "user": { ... }
  }
}
```

**Tests** :
- ✅ Connexion valide
- ✅ Email invalide → 400
- ✅ Mot de passe incorrect → 400
- ✅ Email non existant → 400


### 1.3 Profil - GET /api/auth/profil

**URL** : `{{baseUrl}}/api/auth/profil`

**Method** : GET

**Headers** :
```
Authorization: Bearer {{token}}
```

**Réponse attendue** (200 OK) :
```json
{
  "succes": true,
  "message": "Succès",
  "data": {
    "_id": "507f1f77...",
    "nom": "Jean Dupont",
    "email": "jean.dupont@email.com",
    "role": "user",
    "age": 30,
    "poids": 75.5,
    "taille": 180,
    "objectif_principal": "Perdre du poids",
    "createdAt": "2026-06-22T10:30:00.000Z"
  }
}
```

**Tests** :
- ✅ Avec token valide → 200
- ✅ Sans token → 401
- ✅ Avec token invalide → 401


### 1.4 Modifier Profil - PUT /api/auth/profil

**URL** : `{{baseUrl}}/api/auth/profil`

**Method** : PUT

**Headers** :
```
Authorization: Bearer {{token}}
```

**Body** :
```json
{
  "nom": "Jean Dupont",
  "age": 31,
  "poids": 73.5,
  "taille": 180,
  "objectif_principal": "Prendre du muscle"
}
```

**Réponse attendue** (200 OK) : Utilisateur mis à jour

---

## 🏋️ 2. GESTION DES EXERCICES

### 2.1 Lister les exercices - GET /api/exercices

**URL** : `{{baseUrl}}/api/exercices?categorie=musculation&niveau=debutant`

**Method** : GET

**Parameters (Query)** :
- `categorie` : musculation | cardio | flexibilite | equilibre (optionnel)
- `niveau` : debutant | intermediaire | avance (optionnel)
- `search` : texte à chercher (optionnel)

**Headers** :
```
Authorization: Bearer {{token}}
```

**Réponse attendue** (200 OK) :
```json
{
  "succes": true,
  "message": "Succès",
  "data": [
    {
      "_id": "507f1f77...",
      "nom": "Pompes",
      "description": "Exercice de base pour le haut du corps",
      "categorie": "musculation",
      "niveauDifficulte": "debutant",
      "muscles": ["poitrine", "triceps", "épaules"],
      "creePar": null
    }
  ]
}
```

**Tests** :
- ✅ Lister tous les exercices
- ✅ Filtrer par catégorie
- ✅ Filtrer par niveau
- ✅ Filtrer par les deux


### 2.2 Obtenir un exercice - GET /api/exercices/:id

**URL** : `{{baseUrl}}/api/exercices/507f1f77bcf86cd799439011`

**Method** : GET

**Réponse attendue** (200 OK) : Un exercice avec détails


### 2.3 Créer un exercice - POST /api/exercices

**URL** : `{{baseUrl}}/api/exercices`

**Method** : POST

**Headers** :
```
Authorization: Bearer {{token}}
```

**Body** :
```json
{
  "nom": "Squats",
  "description": "Exercice pour les jambes",
  "categorie": "musculation",
  "niveauDifficulte": "intermediaire",
  "muscles": ["quadriceps", "fessiers", "ischio"]
}
```

**Réponse attendue** (201 Created) : Exercice créé


### 2.4 Modifier un exercice - PUT /api/exercices/:id

**URL** : `{{baseUrl}}/api/exercices/507f1f77bcf86cd799439011`

**Method** : PUT

**Body** :
```json
{
  "nom": "Squats Bulgarian",
  "description": "Variante avec une jambe"
}
```


### 2.5 Supprimer un exercice - DELETE /api/exercices/:id

**URL** : `{{baseUrl}}/api/exercices/507f1f77bcf86cd799439011`

**Method** : DELETE

**Réponse attendue** (200 OK) :
```json
{
  "succes": true,
  "message": "Succès"
}
```

---

## 📅 3. GESTION DES SÉANCES

### 3.1 Lister les séances - GET /api/seances

**URL** : `{{baseUrl}}/api/seances`

**Method** : GET

**Headers** :
```
Authorization: Bearer {{token}}
```

**Réponse attendue** :
```json
{
  "succes": true,
  "data": [
    {
      "_id": "507f1f77...",
      "utilisateur": "507f1f77...",
      "nom": "Full Body Monday",
      "description": "Séance complète",
      "dureeEstimee": 60,
      "estPublique": false,
      "createdAt": "2026-06-22T10:00:00.000Z"
    }
  ]
}
```


### 3.2 Créer une séance - POST /api/seances

**URL** : `{{baseUrl}}/api/seances`

**Method** : POST

**Headers** :
```
Authorization: Bearer {{token}}
```

**Body** :
```json
{
  "nom": "Jeudi Cardio",
  "description": "Journée cardio intense",
  "dureeEstimee": 45,
  "estPublique": false
}
```

**Réponse attendue** (201 Created) : ID de la séance créée (à noter)


### 3.3 Obtenir une séance - GET /api/seances/:id

**URL** : `{{baseUrl}}/api/seances/507f1f77bcf86cd799439011`

**Method** : GET

**Réponse** : Détails de la séance


### 3.4 Modifier une séance - PUT /api/seances/:id

**URL** : `{{baseUrl}}/api/seances/507f1f77bcf86cd799439011`

**Method** : PUT

**Body** :
```json
{
  "nom": "Vendredi Cardio",
  "dureeEstimee": 50,
  "estPublique": true
}
```


### 3.5 Supprimer une séance - DELETE /api/seances/:id

**URL** : `{{baseUrl}}/api/seances/507f1f77bcf86cd799439011`

**Method** : DELETE

---

## 📝 4. DÉTAILS DE SÉANCE (Exercices dans une séance)

### 4.1 Ajouter un exercice à une séance - POST /api/seances/:seanceId/details

**URL** : `{{baseUrl}}/api/seances/507f1f77bcf86cd799439011/details`

**Method** : POST

**Body** :
```json
{
  "exercice": "507f1f77bcf86cd799439022",
  "ordre": 1,
  "series": 3,
  "repetitions": 10,
  "poidsKg": 20,
  "reposSecondes": 60,
  "notes": "Bonne forme"
}
```

**Réponse attendue** (201 Created) : Détail créé

**Notes** :
- `repetitions` : pour musculation/force
- `dureeSecondes` : pour cardio (remplace repetitions)
- `ordre` : position de l'exercice dans la séance (1, 2, 3...)


### 4.2 Lister les exercices d'une séance - GET /api/seances/:seanceId/details

**URL** : `{{baseUrl}}/api/seances/507f1f77bcf86cd799439011/details`

**Method** : GET

**Réponse** : Liste des exercices avec paramètres


### 4.3 Modifier un détail de séance - PUT /api/seances/:seanceId/details/:detailId

**URL** : `{{baseUrl}}/api/seances/507f1f77bcf86cd799439011/details/507f1f77bcf86cd799439033`

**Method** : PUT

**Body** :
```json
{
  "series": 4,
  "repetitions": 12,
  "poidsKg": 25
}
```


### 4.4 Supprimer un exercice d'une séance - DELETE /api/seances/:seanceId/details/:detailId

**URL** : `{{baseUrl}}/api/seances/507f1f77bcf86cd799439011/details/507f1f77bcf86cd799439033`

**Method** : DELETE

---

## 📊 5. HISTORIQUE DES ENTRAÎNEMENTS

### 5.1 Lister l'historique - GET /api/historique

**URL** : `{{baseUrl}}/api/historique?debut=2026-06-01&fin=2026-06-30`

**Method** : GET

**Parameters (Query)** :
- `debut` : date début (format ISO 8601 : 2026-06-01)
- `fin` : date fin

**Headers** :
```
Authorization: Bearer {{token}}
```

**Réponse** :
```json
{
  "succes": true,
  "data": [
    {
      "_id": "507f1f77...",
      "utilisateur": "507f1f77...",
      "seance": { "_id": "...", "nom": "Full Body" },
      "dateEntrainement": "2026-06-22T15:30:00.000Z",
      "dureeReelle": 55,
      "calories": 350,
      "ressenti": "moyen",
      "notes": "Très bon entraînement"
    }
  ]
}
```


### 5.2 Ajouter un entraînement - POST /api/historique

**URL** : `{{baseUrl}}/api/historique`

**Method** : POST

**Body** :
```json
{
  "seance": "507f1f77bcf86cd799439011",
  "dureeReelle": 50,
  "calories": 300,
  "ressenti": "facile",
  "notes": "Facile aujourd'hui, reposé"
}
```

**Réponse attendue** (201 Created)


### 5.3 Supprimer un entraînement - DELETE /api/historique/:id

**URL** : `{{baseUrl}}/api/historique/507f1f77bcf86cd799439011`

**Method** : DELETE


### 5.4 Statistiques hebdomadaires - GET /api/historique/statistiques

**URL** : `{{baseUrl}}/api/historique/statistiques`

**Method** : GET

**Réponse** :
```json
{
  "succes": true,
  "data": [
    {
      "_id": { "semaine": 25, "annee": 2026 },
      "totalSeances": 3,
      "totalCalories": 1050,
      "totalDuree": 150
    }
  ]
}
```

**Utilisation** : Pour afficher le graphique du dashboard


### 5.5 Exercices populaires - GET /api/historique/exercices-populaires

**URL** : `{{baseUrl}}/api/historique/exercices-populaires`

**Method** : GET

**Réponse** :
```json
{
  "succes": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "nombre": 12,
      "seriesMoyenne": 3.5,
      "repetitionsMoyenne": 10,
      "exerciceData": {
        "nom": "Pompes",
        "categorie": "musculation"
      }
    }
  ]
}
```

---

## 🎯 6. GESTION DES OBJECTIFS

### 6.1 Lister les objectifs - GET /api/objectifs

**URL** : `{{baseUrl}}/api/objectifs`

**Method** : GET

**Réponse** :
```json
{
  "succes": true,
  "data": [
    {
      "_id": "507f1f77...",
      "utilisateur": "507f1f77...",
      "titre": "Perdre 5 kg",
      "type": "poids",
      "valeurCible": 75,
      "valeurActuelle": 80,
      "dateEcheance": "2026-09-22",
      "statut": "en_cours"
    }
  ]
}
```


### 6.2 Créer un objectif - POST /api/objectifs

**URL** : `{{baseUrl}}/api/objectifs`

**Method** : POST

**Body** :
```json
{
  "titre": "Faire 20 pompes sans pause",
  "type": "performance",
  "valeurCible": 20,
  "valeurActuelle": 10,
  "dateEcheance": "2026-08-22",
  "statut": "en_cours"
}
```

**Types possibles** :
- `poids` : perte/gain de poids (en kg)
- `seances_par_semaine` : nombre de séances (ex: 4/semaine)
- `calories` : calories à brûler (ex: 2000 calories/semaine)
- `performance` : amélioration (ex: 20 pompes)


### 6.3 Modifier un objectif - PUT /api/objectifs/:id

**URL** : `{{baseUrl}}/api/objectifs/507f1f77bcf86cd799439011`

**Method** : PUT

**Body** :
```json
{
  "valeurActuelle": 15,
  "statut": "atteint"
}
```


### 6.4 Supprimer un objectif - DELETE /api/objectifs/:id

**URL** : `{{baseUrl}}/api/objectifs/507f1f77bcf86cd799439011`

**Method** : DELETE

---

## 🧪 SCÉNARIO DE TEST COMPLET

**Suivre cet ordre pour tester le workflow complet :**

1. **✅ Inscription** → POST /auth/inscription
   - Noter le token

2. **✅ Profil** → GET /auth/profil
   - Vérifier les données

3. **✅ Exercices** → GET /exercices
   - Lister les exercices
   - Filtrer par catégorie

4. **✅ Créer séance** → POST /seances
   - Noter l'ID

5. **✅ Ajouter exercices** → POST /seances/:id/details
   - Ajouter 3 exercices différents

6. **✅ Enregistrer entraînement** → POST /historique
   - Saisir durée, calories, ressenti

7. **✅ Voir historique** → GET /historique
   - Vérifier l'entraînement

8. **✅ Statistiques** → GET /historique/statistiques
   - Voir les stats hebdomadaires

9. **✅ Objectifs** → POST /objectifs + PUT
   - Créer un objectif
   - Mettre à jour la progression

10. **✅ Supprimer** → DELETE routes
    - Supprimer un entraînement
    - Supprimer un objectif

---

## ❌ CAS D'ERREUR À TESTER

| Cas | URL | Erreur attendue |
|-----|-----|-----------------|
| Sans token | GET /api/seances | 401 Unauthorized |
| Token invalide | GET /api/seances | 401 Token invalide |
| Exercice inexistant | GET /api/exercices/invalid | 404 Not Found |
| Email duplicate | POST /auth/inscription | 409 Email déjà utilisé |
| Données invalides | POST /api/seances (corps vide) | 400 Bad Request |
| Accès données autre user | DELETE /api/seances/autreUser | 404 Not Found |

---

## 📌 SCRIPT DE TEST RAPIDE (curl)

```bash
# Inscription
curl -X POST http://localhost:5000/api/auth/inscription \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "email": "test@test.com",
    "motDePasse": "Test123"
  }'

# Connexion
curl -X POST http://localhost:5000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "motDePasse": "Test123"
  }'

# Lister séances (remplacer TOKEN par le token reçu)
curl -X GET http://localhost:5000/api/seances \
  -H "Authorization: Bearer TOKEN"
```

---

**✅ Tests complets = Application prête pour production ! 🚀**
