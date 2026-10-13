# Rapport d'intégration SOAP — Groupe 3 (Fitness Tracking / Medical API)

**Périmètre :** `legacy-medical-api/` et `Fitnessapp/fitness-app/`

**Dépôt :** https://github.com/benisse257/Projet-API-SOAP (`main`)

**Mise à jour :** 13 octobre 2026

## 1. Architecture cible (réalisée)

```
                 ┌──────────────────────────────┐
                 │ Spring Boot                  │
                 │ legacy-medical-api           │
                 │ SOAP + JPA + SQL (H2)        │
                 └──────────────┬───────────────┘
                                │
                              SOAP / WSDL
                    http://localhost:8080/ws/mon-service.wsdl
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Node.js / Express            │
                 │ Fitness Application          │
                 │ backend/services/medicalSoapService.js
                 │ backend/controllers/medicalController.js
                 │ XML → JavaScript/JSON        │
                 │ Mongoose                     │
                 └──────────────┬───────────────┘
                                │
                                ▼
                             MongoDB
                     collection: medicalprofiles
```

Règle respectée : **la logique métier médicale est 100 % dans Spring Boot**.
Node.js est uniquement un **adaptateur SOAP** (appel WSDL → mapping XML/JSON → sauvegarde MongoDB → gestion d'erreurs).

## 2. Décisions prises (à assumer en soutenance)

| Question du sujet | Décision | Justification |
|---|---|---|
| `getMedicalClearance` vs `getMedicalClearanceAndRestrictions` | **`getMedicalClearanceAndRestrictions`** | Nom le plus descriptif (il renvoie restrictions + clearance). Utilisé partout : XSD, classe générée JAXB, `@PayloadRoot`, service Node, Postman. |
| `allowedExercises` sans table source dans le sujet | Champ conservé dans le XSD, liste vide en réponse | Le modèle SQL reste limité aux deux tables demandées. Aucune table ni règle de whitelist n'est inventée; Node n'applique pas de whitelist quand cette liste est vide. |
| Date | `LocalDate` → `xs:date` → chaîne `yyyy-MM-dd` JSON → `Date` Mongo | Adapter JAXB `LocalDateAdapter` (binding.xjb) ; côté Node, `new Date("2027-12-31T00:00:00Z")` puis stockage Mongoose `Date`, rendu `yyyy-MM-dd`. |
| Base SQL | H2 en mémoire | Aucune installation nécessaire, données injectées au démarrage (`DataInitializer`). |

## 3. Projet Spring Boot — fichiers livrés

| Élément | Fichier |
|---|---|
| Contrat XML | `src/main/resources/xsd/medical-clearance.xsd` |
| Binding JAXB (dates + package) | `src/main/resources/xsd/binding.xjb` |
| Entités JPA | `model/PatientRecord`, `model/MedicalRestriction`, `model/RestrictionType` |
| Repository | `repository/PatientRecordRepository` (`findByPatientExternalId`) |
| Service métier | `service/MedicalClearanceService` |
| Exception → SOAP Fault | `service/PatientNotFoundException` (`@SoapFault(SENDER)`) |
| Endpoint | `endpoint/MedicalClearanceEndpoint` (`@Endpoint`, `@PayloadRoot`) |
| WSDL | `config/WebServiceConfig` (`DefaultWsdl11Definition`, bean `mon-service`) |
| Données test | `config/DataInitializer` |
| Plugin JAXB | `pom.xml` (`org.codehaus.mojo:jaxb2-maven-plugin:4.2.0`, Java 21, Spring Boot 4.1.1) |

## 4. Données de test (conformes au sujet)

| patient_external_id | max_heart_rate | clearance_expiry_date | Restrictions | allowed_exercises |
|---|---|---|---|---|
| PAT001 | 160 | 2027-12-31 | KNEE / AVOID_IMPACT ; BACK / NO_HEAVY_LIFTING | vide (aucune source SQL prévue) |
| PAT002 | 150 | 2027-06-30 | SHOULDER / NO_HEAVY_LIFTING | vide (aucune source SQL prévue) |
| PAT999 | — | — | **absent volontairement** → sert à tester la SOAP Fault | |

## 5. Côté Node.js — fichiers ajoutés (sans toucher au reste)

| Fichier | Rôle |
|---|---|
| `backend/services/medicalSoapService.js` | `soap.createClientAsync(WSDL)` + appel opération + normalisation + erreurs typées |
| `backend/models/MedicalProfile.js` | Schéma Mongoose (userId unique → upsert) |
| `backend/controllers/medicalController.js` | Enchaîne : utilisateur → patientExternalId → SOAP → mapping → save → JSON ; + `validerProgramme` |
| `backend/routes/medicalRoutes.js` | `GET /api/medical/profile` + `POST /api/medical/validate-program` (protégés JWT) |
| `backend/models/Exercice.js` | Ajout champs optionnel `codeExterne` (code EXxxx partagé avec le legacy) |
| `backend/server.js` | Ajout de `['/api/medical', './routes/medicalRoutes']` |
| `package.json` | Dépendance `soap` (`^1.13.0`) |
| `.env.example` | Variables d'environnement documentées (dont `MEDICAL_WSDL_URL`) |
| `backend/config/seeder.js` | Seed complet; Jean est rattaché à `PAT001` |

### Flux de la route `GET /api/medical/profile`

1. `protect` vérifie le JWT → `req.utilisateur.id`
2. Chargement de l'`Utilisateur` → son `patientExternalId`
3. `medicalSoapService.getMedicalClearanceAndRestrictions(id)` :
   - `soap.createClientAsync(process.env.MEDICAL_WSDL_URL || http://localhost:8080/ws/mon-service.wsdl)`
   - `client.GetMedicalClearanceAndRestrictionsAsync({ patientExternalId })`
4. Normalisation : `toArray()` (0 ou 1 élément SOAP), validation `maxHeartRate` entier, validation de la date, liste `jointRestrictions`/`allowedExercises`
5. Upsert MongoDB : `findOneAndUpdate({ userId }, { $set: {...} }, { new: true, upsert: true })`
6. Réponse JSON `{ success: true, data: {...}, source: 'SOAP' }`

### Endpoint complémentaire : `POST /api/medical/validate-program`

Scénario du sujet : « avant de valider un programme intense, vérifier les restrictions médicales du sportif ».

1. Réception de `{ programmeId }` → chargement du `Programme` (1 sportif propriétaire) + séances + détails + exercices
2. Permissions : un `sportif` ne peut valider que son propre programme ; un `admin` peut tout valider
3. Remontée SOAP **fraîche** des restrictions du sportif (`getMedicalClearanceAndRestrictions` — Spring reste la source de vérité)
4. Règles de décision (interprétation côté Fitness uniquement, pas de logique médicale dupliquée) :

| Règle | Condition de blocage | Exemple |
|---|---|---|
| Clearance expirée | `clearanceExpiryDate < aujourd'hui` | blocage sur tous les exercices |
| Liste blanche d'exercices | Non appliquée : le sujet ne fournit aucune table source | `allowedExercises` reste vide; les restrictions articulaires restent appliquées |
| `AVOID_IMPACT` | exercice `cardio` **ou** muscles touchant l'articulation (KNEE/BACK/SHOULDER/...) | Squat (quadriceps) bloqué pour KNEE |
| `NO_HEAVY_LIFTING` | muscles touchant l'articulation **et** `poidsKg > 20` | aucun sur exercices légers |

5. Réponse : `decision` (`AUTORISE`/`BLOQUE`), `resume` (exercices/autorises/bloques), détails des blocages (exercice, séance, raisons) + rappel du profil médical
6. Un même exercice présent dans plusieurs séances n'est compté qu'une fois (dédoublonnage par `exercice._id`)

## 6. Résultats des tests

Validation rejouée le 13 octobre 2026 : `mvnw.cmd clean test` (1 test réussi),
`node TESTER_INTEGRATION_SOAP.js --route` (32 réussites, 0 échec). Ce parcours
vérifie les échanges SOAP, l'upsert MongoDB et la validation de programme.
Les scénarios HTTP 503 et 502 ont ensuite été vérifiés séparément : Spring arrêté
pour le 503; erreur `DATE_INVALIDE` simulée à la frontière du service pour le 502.
Le parsing de XML SOAP malformé n'a pas été testé de bout en bout.

### Test 1 — PAT001 (2 restrictions)
```
HTTP 200 — data.maxHeartRate = 160
jointRestrictions = [ KNEE/AVOID_IMPACT, BACK/NO_HEAVY_LIFTING ]
allowedExercises  = []
clearanceExpiryDate = "2027-12-31"
```
XML réel : voir `integration-soap/xml/PAT001-response.xml`

### Test 2 — PAT002 (1 restriction)
```
HTTP 200 — data.maxHeartRate = 150
jointRestrictions = [ SHOULDER/NO_HEAVY_LIFTING ]
allowedExercises  = []
clearanceExpiryDate = "2027-06-30"
```
XML réel : voir `integration-soap/xml/PAT002-response.xml`

### Test 3 — PAT999 (patient inexistant → SOAP Fault)
- Réponse Spring : `<faultcode>SOAP-ENV:Client</faultcode>` / `Patient inexistant : PAT999`
- Node : **HTTP 404** `{ "success": false, "message": "SOAP-ENV:Client: Patient inexistant : PAT999" }` (kind = `SOAP_FAULT`)

### Test 4 — Spring Boot arrêté
- Spring a été arrêté pendant que Node et MongoDB restaient actifs. L'appel authentifié `GET /api/medical/profile` a renvoyé **HTTP 503**; Node est resté actif.

### Test 5 — MongoDB (upsert)
- Appel de la route avec PAT001 : document créé/mis à jour, puis vérifié en MongoDB par le test `--route`.
- L'index unique sur `userId` assure un seul profil par utilisateur.
- Collection : `medicalprofiles`

### Test 6 — Plusieurs restrictions
- PAT001 avec 2 restrictions (KNEE + BACK) : array de 2 objets correctement mappé.

### Test 7 — Mapping de la date
- Spring `LocalDate(2027,12,31)` → XML `2027-12-31` → Node `"2027-12-31T00:00:00.000Z"` → document Mongo `Date` (`clearanceExpiryDate`) → JSON `"2027-12-31"`.

### Test 8 — Date invalide (HTTP 502)
- Une erreur `DATE_INVALIDE` a été simulée au retour du service SOAP; le contrôleur a répondu **HTTP 502**.
- Ce test valide le mapping d'erreur du contrôleur, pas le parsing d'une enveloppe SOAP XML malformée.

| Cas | Code HTTP | Mécanisme |
|---|---|---|
| Patient existe | 200 | réponse SOAP + upsert |
| Patient inexistant | 404 | SOAP Fault → `kind='SOAP_FAULT'` |
| Spring arrêté | 503 | `kind='SOAP_UNAVAILABLE'` (testé le 13 octobre) |
| Réponse inattendue / date invalide | 502 | `DATE_INVALIDE` simulée au niveau du contrôleur le 13 octobre; enveloppe SOAP malformée non testée de bout en bout |
| Erreur MongoDB | 500 | catch du controller |
| Utilisateur sans `patientExternalId` | 400 | contrôle en amont de l'appel SOAP |

## 7. Reproduction des tests

```bash
# 1. Terminal A — Spring Boot (http://localhost:8080)
cd legacy-medical-api && .\mvnw.cmd spring-boot:run

# 2. Terminal B — Node (http://localhost:5000)
cd Fitnessapp/fitness-app
npm install
copy .env.example .env     # ou : cp .env.example .env
npm run seed               # réinitialise les collections de démo puis crée Jean => PAT001
npm run dev

# 3. Postman : importer integration-soap/collection-postman.json
#    (login jean@gmail.com / jean1234 puis GET /api/medical/profile)
#    La collection contient les requêtes ET les réponses enregistrées :
#    WSDL, PAT001 (succès), PAT002 (succès), PAT999 (SOAP Fault),
#    login (JWT), profil synchronisé + les 2 cas d'erreur (404 / 503).
```

### Compte de démonstration

`npm run seed` lance `backend/config/seeder.js` et crée `jean@gmail.com / jean1234`
(rôle `sportif`) avec `patientExternalId = PAT001`. Il efface puis recrée les
collections de démonstration (utilisateurs, exercices, séances, détails,
historiques et objectifs); ne le lance pas sur une base contenant des données à
conserver. Le champ SOAP `allowedExercises` est vide car le sujet ne prévoit pas
de table SQL pour l'alimenter.

### Test automatisé

```bash
node TESTER_INTEGRATION_SOAP.js           # 10 assertions sur le client SOAP
node TESTER_INTEGRATION_SOAP.js --route   # + routes REST et écriture MongoDB
```

Le script réutilise l'utilisateur déjà rattaché à `PAT001` (celui du seed), ce qui
respecte l'index unique `patientExternalId` du modèle `Utilisateur`.

Appel direct avec curl :
```bash
curl -X POST http://localhost:8080/ws -H "Content-Type: text/xml; charset=utf-8" \
     --data @integration-soap/xml/PAT001-request.xml
```

## 8. Questions probables de soutenance (avec réponses)

1. **Pourquoi deux applications ?** L'API médicale est « legacy » (Spring Boot/SOAP/SQL), l'appli fitness est moderne (Node/Express/MongoDB). On ne réécrit pas la logique médicale : Node la consomme via SOAP.

2. **Comment génère-t-on les classes Java ?** Le `jaxb2-maven-plugin` (`org.codehaus.mojo`, 4.2.0) lit le XSD (`medical-clearance.xsd`) et le binding `binding.xjb`, puis génère les classes dans `com.legacymedical.ws` au build (`target/generated-sources/xjc`).

3. **Comment Spring WS construit le WSDL ?** `DefaultWsdl11Definition` + `SimpleXsdSchema` au démarrage ; URL = nom du bean (`mon-service`) + `/ws/`. `setTransformWsdlLocations(true)` adapte l'URL à la requête.

4. **Que fait le service SOAP Node ?** `soap.createClientAsync(WSDL)` → `GetMedicalClearanceAndRestrictionsAsync({ patientExternalId })` → normalisation (fault, arrays, date) → retour JSON prêt pour Mongoose.

5. **Upsert ?** `findOneAndUpdate({ userId }, { $set }, { upsert: true, new: true })` : crée si absent, met à jour si présent — un seul MedicalProfile par utilisateur (index unique `userId`).

6. **Comment est gérée la SOAP Fault ?** La lib `soap` place la fault dans `err.root.Envelope.Body.Fault` → `extraireFault()` l'extrait → le controller renvoie 404.

7. **Et si Spring est éteint ?** `createClientAsync` rejette → `SOAP_UNAVAILABLE` → HTTP 503, l'API Fitness continue de vivre.

8. **Pourquoi `allowedExercises` est vide ?** Le champ figure dans la réponse exigée, mais aucune table SQL source n'est décrite. Le contrat conserve donc le champ sans ajouter une troisième table ni inventer des autorisations.

9. **Comment la date traverse-t-elle le système ?** `LocalDate` Java → (JAXB `LocalDateAdapter` + binding) `xs:date` → XML `"2027-12-31"` → JS → `Date` Mongo → rendu `yyyy-MM-dd`. Aucun décalage de fuseau grâce à la normalisation UTC.

10. **Où est la logique métier ?** Dans `MedicalClearanceService` (Spring). L'endpoint SOAP ne fait qu'appeler le service ; Node ne contient que du mapping/adaptation.

## 9. Conformité au cahier des charges et aux critères d'évaluation

### Cahier des charges

| Exigence (sujet) | Statut | Où |
|---|---|---|
| Spring Boot `spring-boot-starter-data-jpa` + base SQL | ✅ | `legacy-medical-api/pom.xml`, H2 (`jdbc:h2:mem:medicaldb`) |
| WSDL/XSD (types + namespaces) | ✅ | `legacy-medical-api/src/main/resources/xsd/medical-clearance.xsd` |
| Génération JAXB | ✅ | `legacy-medical-api/pom.xml` (`jaxb2-maven-plugin:4.2.0`) → `com.legacymedical.ws` |
| `@Endpoint` + `@PayloadRoot` (+ payload annotations) | ✅ | `legacy-medical-api/src/main/java/com/legacymedical/endpoint/MedicalClearanceEndpoint.java` |
| Endpoint WSDL accessible | ✅ | `http://localhost:8080/ws/mon-service.wsdl` |
| Node `soap` + `createClientAsync` | ✅ | `Fitnessapp/fitness-app/package.json`, `backend/services/medicalSoapService.js` |
| Consommation asynchrone + mapping Mongoose | ✅ | `backend/controllers/medicalController.js` → upsert `backend/models/MedicalProfile.js` |
| Capture de la SOAP Fault / pannes | Partielle | SOAP Fault 404 et panne Spring 503 testées; mapping 502 testé avec erreur simulée; parsing XML malformé restant à tester |
| Non-duplication de la logique métier | ✅ | logique dans `MedicalClearanceService` (Spring), Node = adaptateur |

### Critères d'évaluation (pondération du sujet)

| Critère | Verdict |
|---|---|
| **Qualité du Contrat WSDL/XSD (50%)** : typage (`xs:int`/`xs:date`/enum), namespaces, fidélité aux tables SQL | Conforme |
| **Consommation & Mapping (20%)** : appel async, XML→JSON propre avant insertion | Conforme (normalisation + validation types/date) |
| **Intégration & Réutilisation (20%)** : réutilise `protect` + modèle `Utilisateur` existants | Conforme |
| **Gestion des erreurs** | 404 et 503 testés en HTTP; 502 testé avec erreur contrôlée simulée; SOAP XML malformé non testé de bout en bout |

### Points à assumer en soutenance

1. **Nom du plugin JAXB** : le projet utilise le plugin demandé, `org.codehaus.mojo:jaxb2-maven-plugin:4.2.0`; sa configuration charge le XSD et le binding JAXB.
2. **Input XML `patientExternalId`** : le sujet parle d'un « userId » ; le contrat expose `patientExternalId`, cohérent avec la colonne SQL `patient_external_id` (aucune table `user` n'existe côté legacy). L'utilisateur Node (`patientExternalId` sur l'`Utilisateur`) est relié à ce patient.
3. **`allowedExercises` sans table source** : le champ du contrat reste vide; aucune troisième table n'est créée. La validation Node n'applique pas de whitelist sur une liste vide.

## 10. Checklist des livrables de l'enseignant

| Livrable demandé | Fichier / preuve dans le dépôt | État |
|---|---|---|
| Code source complet de l'application Fitness existante | `Fitnessapp/fitness-app/` (backend, frontend, `package.json`) | Présent |
| Micro-projet legacy Spring Boot autonome | `legacy-medical-api/` (`pom.xml`, Maven Wrapper, sources Java) | Présent |
| Dépendances Spring Web Services, JPA et base SQL | `legacy-medical-api/pom.xml`; configuration H2 dans `src/main/resources/application.properties` | Présent; H2 en mémoire |
| Deux tables SQL du scénario | `model/PatientRecord.java`, `model/MedicalRestriction.java`, initialisation dans `config/DataInitializer.java` | Présent; PAT001/PAT002, PAT999 absent |
| Contrat XSD et génération JAXB | `src/main/resources/xsd/medical-clearance.xsd`, `binding.xjb`, plugin `jaxb2-maven-plugin` dans `pom.xml` | Présent; classes générées au build |
| Endpoint SOAP, repository, service et WSDL | `endpoint/MedicalClearanceEndpoint.java`, `repository/PatientRecordRepository.java`, `service/MedicalClearanceService.java`, `config/WebServiceConfig.java` | Présent; WSDL `/ws/mon-service.wsdl` |
| Client SOAP Node asynchrone et mapping XML → objet JS | `backend/services/medicalSoapService.js` (`soap.createClientAsync`) | Présent |
| Persistance du profil médical côté MongoDB | `backend/models/MedicalProfile.js`, `backend/controllers/medicalController.js` (upsert), `backend/routes/medicalRoutes.js` | Présent; vérifié par test d'intégration |
| Gestion des SOAP Fault et des indisponibilités | `service/PatientNotFoundException.java`, `medicalSoapService.js`, `medicalController.js` | 404 SOAP Fault et 503 testés; 502 testé par simulation contrôlée |
| Collection Postman et exemples de requêtes/réponses XML | `integration-soap/collection-postman.json`, `integration-soap/xml/` | Présent; succès PAT001/PAT002 et SOAP Fault PAT999 |
| Tests automatisés et rapport d'exécution | `legacy-medical-api/src/test/`, `Fitnessapp/fitness-app/TESTER_INTEGRATION_SOAP.js` | Maven : 1 test réussi; intégration Node : 32 réussites, 0 échec |
| Documentation de démarrage et de soutenance | `README.md`, `integration-soap/README.md`, présent rapport | Présent |
| Dépôt Git | [Projet-API-SOAP](https://github.com/benisse257/Projet-API-SOAP), branche `main` | Publié; vérifier que le dépôt est accessible à l'enseignant |

### Éléments à vérifier avant la démonstration

- Démarrer MongoDB, Spring Boot puis Fitness Node.js dans cet ordre; les services doivent écouter sur `27017`, `8080` et `5000`.
- Le seed `npm run seed` recrée les collections de démonstration; ne pas l'exécuter si la base contient des données à conserver.
- La requête Postman `POST /api/medical/validate-program` nécessite un `programmeId` réel; le seed ne crée pas de programme. Le script `TESTER_INTEGRATION_SOAP.js --route` crée et nettoie ses propres objets de test.
- `allowedExercises` est vide car le schéma SQL demandé ne fournit aucune source pour cette liste. Cette interprétation est explicitée dans le XSD et le présent rapport.
- L'intitulé de l'opération varie dans le sujet (`getMedicalClearance` et `getMedicalClearanceAndRestrictions`); le projet utilise uniformément `getMedicalClearanceAndRestrictions`.