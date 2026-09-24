# Rapport d'intégration SOAP — Groupe 3 (Fitness Tracking / Medical API)

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
| `allowedExercises` sans table source dans le sujet | Création d'une **3ᵉ table `allowed_exercise`** | Le sujet exige ce champ dans la réponse SOAP mais ne décrit AUCUNE table pour l'alimenter. Décision signalée (pas faite en silence) et documentée : table minimale `allowed_exercise(patient_record_id, exercise_id)`. |
| Date | `LocalDate` → `xs:date` → chaîne `yyyy-MM-dd` JSON → `Date` Mongo | Adapter JAXB `LocalDateAdapter` (binding.xjb) ; côté Node, `new Date("2027-12-31T00:00:00Z")` puis stockage Mongoose `Date`, rendu `yyyy-MM-dd`. |
| Base SQL | H2 en mémoire | Aucune installation nécessaire, données injectées au démarrage (`DataInitializer`). |

## 3. Projet Spring Boot — fichiers livrés

| Élément | Fichier |
|---|---|
| PDF sujet / contrat | `src/main/resources/xsd/medical-clearance.xsd` |
| Binding JAXB (dates + package) | `src/main/resources/xsd/binding.xjb` |
| Entités JPA | `model/PatientRecord`, `model/MedicalRestriction`, `model/AllowedExercise`, `model/RestrictionType` |
| Repository | `repository/PatientRecordRepository` (`findByPatientExternalId`) |
| Service métier | `service/MedicalClearanceService` |
| Exception → SOAP Fault | `service/PatientNotFoundException` (`@SoapFault(SENDER)`) |
| Endpoint | `endpoint/MedicalClearanceEndpoint` (`@Endpoint`, `@PayloadRoot`) |
| WSDL | `config/WebServiceConfig` (`DefaultWsdl11Definition`, bean `mon-service`) |
| Données test | `config/DataInitializer` |
| Plugin JAXB | `pom.xml` (`jaxb-maven-plugin` 4.0.12, Java 21, spring-boot 4.1.1) |

## 4. Données de test (conformes au sujet)

| patient_external_id | max_heart_rate | clearance_expiry_date | Restrictions | allowed_exercises |
|---|---|---|---|---|
| PAT001 | 160 | 2027-12-31 | KNEE / AVOID_IMPACT ; BACK / NO_HEAVY_LIFTING | EX001, EX003 |
| PAT002 | 150 | 2027-06-30 | SHOULDER / NO_HEAVY_LIFTING | EX002, EX004, EX006 |
| PAT003 | 165 | 2027-01-15 | (aucune) | EX001 |
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
| `allowedExercises` (liste blanche) | exercice doté d'un `codeExterne` (EXxxx) absent de la liste | `EX002` non autorisé pour PAT001 |
| `AVOID_IMPACT` | exercice `cardio` **ou** muscles touchant l'articulation (KNEE/BACK/SHOULDER/...) | Squat (quadriceps) bloqué pour KNEE |
| `NO_HEAVY_LIFTING` | muscles touchant l'articulation **et** `poidsKg > 20` | aucun sur exercices légers |

5. Réponse : `decision` (`AUTORISE`/`BLOQUE`), `resume` (exercices/autorises/bloques), détails des blocages (exercice, séance, raisons) + rappel du profil médical
6. Un même exercice présent dans plusieurs séances n'est compté qu'une fois (dédoublonnage par `exercice._id`)

## 6. Résultats des tests (exécutés)

### Test 1 — PAT001 (2 restrictions)
```
HTTP 200 — data.maxHeartRate = 160
jointRestrictions = [ KNEE/AVOID_IMPACT, BACK/NO_HEAVY_LIFTING ]
allowedExercises  = [ EX001, EX003 ]
clearanceExpiryDate = "2027-12-31"
```
XML réel : voir `integration-soap/xml/PAT001-response.xml`

### Test 2 — PAT002 (1 restriction)
```
HTTP 200 — data.maxHeartRate = 150
jointRestrictions = [ SHOULDER/NO_HEAVY_LIFTING ]
allowedExercises  = [ EX002, EX004, EX006 ]
clearanceExpiryDate = "2027-06-30"
```
XML réel : voir `integration-soap/xml/PAT002-response.xml`

### Test 3 — PAT999 (patient inexistant → SOAP Fault)
- Réponse Spring : `<faultcode>SOAP-ENV:Client</faultcode>` / `Patient inexistant : PAT999`
- Node : **HTTP 404** `{ "success": false, "message": "SOAP-ENV:Client: Patient inexistant : PAT999" }` (kind = `SOAP_FAULT`)

### Test 4 — Spring Boot arrêté
- Node : **HTTP 503** `connect ECONNREFUSED ...:8080`, **le serveur Node ne plante pas** (kind = `SOAP_UNAVAILABLE`)

### Test 5 — MongoDB (upsert)
- 1ᵉʳ appel (PAT001) : document créé `_id: 6ab518e4...`
- 2ᵉ appel (PAT002) : **même `_id` mis à jour** (createdAt conservé, updatedAt changé)
- Collection : `medicalprofiles`

### Test 6 — Plusieurs restrictions
- PAT001 avec 2 restrictions (KNEE + BACK) : array de 2 objets correctement mappé.

### Test 7 — Mapping de la date
- Spring `LocalDate(2027,12,31)` → XML `2027-12-31` → Node `"2027-12-31T00:00:00.000Z"` → docteur Mongo `Date` (`clearanceExpiryDate`) → JSON `"2027-12-31"`.

| Cas | Code HTTP | Mécanisme |
|---|---|---|
| Patient existe | 200 | réponse SOAP + upsert |
| Patient inexistant | 404 | SOAP Fault → `kind='SOAP_FAULT'` |
| Spring arrêté | 503 | `kind='SOAP_UNAVAILABLE'` |
| Réponse inattendue / date invalide | 502 | validation `normaliserProfilMedical` (`REPONSE_INATTENDUE` / `DATE_INVALIDE`) |
| Erreur MongoDB | 500 | catch du controller |
| Utilisateur sans `patientExternalId` | 400 | contrôle en amont de l'appel SOAP |

## 7. Reproduction des tests

```bash
# 1. Terminal A — Spring Boot (http://localhost:8080)
cd legacy-medical-api && .\mvnw.cmd spring-boot:run

# 2. Terminal B — Node (http://localhost:5000)
cd Fitnessapp/fitness-app && npm install && npm run dev

# 3. Postman : importer integration-soap/collection-postman.json
#    (login med@example.com / Password123 puis GET /api/medical/profile)
#    La collection contient les requêtes ET les réponses XML complètes :
#    PAT001 (succès), PAT002 (succès), PAT999 (SOAP Fault), login (JWT), profil synchronisé.
```

Appel direct avec curl :
```bash
curl -X POST http://localhost:8080/ws -H "Content-Type: text/xml; charset=utf-8" \
     --data @integration-soap/xml/PAT001-request.xml
```

## 8. Questions probables de soutenance (avec réponses)

1. **Pourquoi deux applications ?** L'API médicale est « legacy » (Spring Boot/SOAP/SQL), l'appli fitness est moderne (Node/Express/MongoDB). On ne réécrit pas la logique médicale : Node la consomme via SOAP.

2. **Comment génère-t-on les classes Java ?** Le `jaxb-maven-plugin` lit le XSD (`medical-clearance.xsd`) et génère les classes dans `com.legacymedical.ws` à chaque build (`target/generated-sources/xjc`).

3. **Comment Spring WS construit le WSDL ?** `DefaultWsdl11Definition` + `SimpleXsdSchema` au démarrage ; URL = nom du bean (`mon-service`) + `/ws/`. `setTransformWsdlLocations(true)` adapte l'URL à la requête.

4. **Que fait le service SOAP Node ?** `soap.createClientAsync(WSDL)` → `GetMedicalClearanceAndRestrictionsAsync({ patientExternalId })` → normalisation (fault, arrays, date) → retour JSON prêt pour Mongoose.

5. **Upsert ?** `findOneAndUpdate({ userId }, { $set }, { upsert: true, new: true })` : crée si absent, met à jour si présent — un seul MedicalProfile par utilisateur (index unique `userId`).

6. **Comment est gérée la SOAP Fault ?** La lib `soap` place la fault dans `err.root.Envelope.Body.Fault` → `extraireFault()` l'extrait → le controller renvoie 404.

7. **Et si Spring est éteint ?** `createClientAsync` rejette → `SOAP_UNAVAILABLE` → HTTP 503, l'API Fitness continue de vivre.

8. **Pourquoi `allowed_exercise` ?** Le champ `allowedExercises` est exigé par le sujet mais aucune table SQL n'est décrite pour le fournir → décision documentée d'ajouter cette 3ᵉ table minimale.

9. **Comment la date traverse-t-elle le système ?** `LocalDate` Java → (JAXB `LocalDateAdapter` + binding) `xs:date` → XML `"2027-12-31"` → JS → `Date` Mongo → rendu `yyyy-MM-dd`. Aucun décalage de fuseau grâce à la normalisation UTC.

10. **Où est la logique métier ?** Dans `MedicalClearanceService` (Spring). L'endpoint SOAP ne fait qu'appeler le service ; Node ne contient que du mapping/adaptation.

## 9. Conformité au cahier des charges et aux critères d'évaluation

### Cahier des charges

| Exigence (sujet) | Statut | Où |
|---|---|---|
| Spring Boot `spring-boot-starter-data-jpa` + base SQL | ✅ | `pom.xml`, H2 (`jdbc:h2:mem:medicaldb`) |
| WSDL/XSD conforme (types + namespaces) | ✅ | `medical-clearance.xsd` (`targetNamespace` + `qualified`) |
| Génération JAXB | ✅ | `jaxb-maven-plugin:4.0.12` → `com.legacymedical.ws` |
| `@Endpoint` + `@PayloadRoot` (+ `@RequestPayload`/`@ResponsePayload`) | ✅ | `endpoint/MedicalClearanceEndpoint` |
| Endpoint WSDL accessible | ✅ | `http://localhost:8080/ws/mon-service.wsdl` |
| Node `npm install soap` + `createClientAsync` | ✅ | `package.json` (`soap ^1.13.0`), `medicalSoapService.js` |
| Consommation asynchrone + mapping vers modèles Mongoose | ✅ | `medicalController.js` → upsert `MedicalProfile` |
| Capture de la SOAP Fault / pannes | ✅ | 404 (fault) / 503 (Spring coupé) / 502 (réponse invalide) |
| Non-duplication de la logique métier | ✅ | logique dans `MedicalClearanceService` (Spring), Node = adaptateur |

### Critères d'évaluation (pondération du sujet)

| Critère | Verdict |
|---|---|
| **Qualité du Contrat WSDL/XSD (50%)** : typage (`xs:int`/`xs:date`/enum), namespaces, fidélité aux tables SQL | Conforme |
| **Consommation & Mapping (20%)** : appel async, XML→JSON propre avant insertion | Conforme (normalisation + validation types/date) |
| **Intégration & Réutilisation (20%)** : réutilise `protect` + modèle `Utilisateur` existants | Conforme |
| **Gestion des erreurs** : SOAP Fault et panne Spring testées | Conforme (testé : 404/503/502) |

### Points à assumer en soutenance

1. **Nom du plugin JAXB** : le sujet cite `jaxb2-maven-plugin`, le projet utilise `org.jvnet.jaxb:jaxb-maven-plugin:4.0.12` (successeur compatible Java 21 + Jakarta XML Binding). Comportement identique : lecture du XSD → génération des classes au build.
2. **Input XML `patientExternalId`** : le sujet parle d'un « userId » ; le contrat expose `patientExternalId`, cohérent avec la colonne SQL `patient_external_id` (aucune table `user` n'existe côté legacy). L'utilisateur Node (`patientExternalId` sur l'`Utilisateur`) est relié à ce patient.
3. **3ᵉ table `allowed_exercise`** : ajoutée car le champ `allowedExercises` est exigé mais aucune table source n'est décrite (voir décision §2).