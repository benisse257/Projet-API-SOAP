# Intégration SOAP — Fitness (Node.js) ⇄ Medical (Spring Boot)

Ce dossier contient tous les livrables de l'intégration SOAP du **Groupe 3 – Fitness Tracking / Medical API**.

## Contenu

| Fichier | Rôle |
|---|---|
| `collection-postman.json` | Collection Postman importable (6 requêtes) |
| `xml/mon-service.wsdl` | Copie du WSDL exposé par Spring Boot |
| `xml/PAT001-request.xml` | Requête SOAP PAT001 (succès) |
| `xml/PAT001-response.xml` | Réponse SOAP PAT001 (160, KNEE+BACK, 2027-12-31) |
| `xml/PAT002-request.xml` | Requête SOAP PAT002 (succès) |
| `xml/PAT002-response.xml` | Réponse SOAP PAT002 (150, SHOULDER, 2027-06-30) |
| `xml/PAT999-request.xml` | Requête SOAP PAT999 (patient inexistant) |
| `xml/PAT999-fault-response.xml` | SOAP Fault renvoyée par Spring WS |
| `RAPPORT_INTEGRATION_SOAP.md` | Rapport complet (tests, décisions, questions de soutenance) |

## Prérequis

1. **Spring Boot** (port 8080) :
   ```bash
   cd legacy-medical-api
   ./mvnw.cmd spring-boot:run     # (Windows PowerShell : .\mvnw.cmd spring-boot:run)
   ```
   WSDL : http://localhost:8080/ws/mon-service.wsdl

2. **MongoDB** doit tourner sur `mongodb://localhost:27017/fitness-app`.

3. **Application Fitness** (port 5000) :
   ```bash
   cd Fitnessapp/fitness-app
   npm install
   npm run dev
   ```

## Tester avec Postman

1. Postman → *Import* → choisir `collection-postman.json`.
2. Exécuter les requêtes **1 à 4** (WSDL + appels SOAP directs vers le port 8080).
3. Dans la requête **5**, lancer le login, puis copier le `token` dans une variable d'environnement Postman `token`.
4. Lancer la requête **6** : `GET http://localhost:5000/api/medical/profile` avec le header `Authorization: Bearer {{token}}`.
   La réponse JSON contient le MedicalProfile **sauvegardé dans MongoDB** après l'appel SOAP.

## Tester avec SoapUI

Créer un projet SOAP avec l'URL `http://localhost:8080/ws/mon-service.wsdl`, puis coller le contenu d'un `*-request.xml` dans la requête `GetMedicalClearanceAndRestrictions`.

## Utilisateur de test créé pour l'intégration

- Email : `med@example.com`
- Mot de passe : `Password123`
- `patientExternalId` associé : `PAT001`