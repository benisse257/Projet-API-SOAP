# Projet API SOAP - Groupe 3

Integration entre une API medicale legacy Spring Boot / SOAP / H2 et l'application Fitness Node.js / Express / MongoDB.

## Structure

- `legacy-medical-api/` : service SOAP, contrat XSD, configuration WSDL et donnees H2 de demonstration.
- `Fitnessapp/fitness-app/` : application Fitness Node.js, routes REST, client SOAP et modeles MongoDB.
- `integration-soap/` : collection Postman, exemples XML, WSDL et rapport de soutenance.

## Demarrage local

Prerequis : Java 21, Node.js, npm et MongoDB sur `localhost:27017`.

1. Demarrer Spring Boot depuis PowerShell :

   ```powershell
   cd legacy-medical-api
   .\mvnw.cmd spring-boot:run
   ```

   WSDL : `http://localhost:8080/ws/mon-service.wsdl`

2. Dans un autre terminal, configurer puis demarrer Fitness :

   ```powershell
   cd Fitnessapp/fitness-app
   Copy-Item .env.example .env
   npm install
   npm run seed
   npm run dev
   ```

   `npm run seed` efface puis recree les collections de demonstration. Ne pas le lancer sur une base contenant des donnees a conserver.

3. Importer `integration-soap/collection-postman.json` dans Postman. Le compte de demonstration relie a `PAT001` est `jean@gmail.com` / `jean1234`.

## Tests

```powershell
cd legacy-medical-api
.\mvnw.cmd clean test
```

Avec Spring Boot, MongoDB et Fitness demarres :

```powershell
cd Fitnessapp/fitness-app
node TESTER_INTEGRATION_SOAP.js
node TESTER_INTEGRATION_SOAP.js --route
```

Le test `--route` exerce aussi l'upsert du profil Mongo et la validation d'un programme.

## Decisions de contrat

- L'operation exposee est `getMedicalClearanceAndRestrictions`.
- Le modele SQL comporte les deux tables demandees : `patient_record` et `medical_restriction`.
- `allowedExercises` reste dans le contrat SOAP, mais est vide : le sujet ne fournit pas de table SQL pour alimenter ce champ.
- Le WSDL est genere depuis le XSD avec `jaxb2-maven-plugin`.
