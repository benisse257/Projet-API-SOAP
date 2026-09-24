/**
 * TESTER_INTEGRATION_SOAP.js — Test complet de l'intégration SOAP (Groupe 3)
 * ===========================================================================
 * Teste la chaîne : Fitness (Node.js) -> SOAP -> Spring Boot (legacy-medical-api) -> MongoDB
 *
 * Prérequis avant de lancer ce script :
 *   1. Spring Boot démarré sur http://localhost:8080
 *        cd legacy-medical-api
 *        .\mvnw.cmd spring-boot:run
 *   2. MongoDB accessible sur mongodb://localhost:27017/fitness-app
 *   3. (Tester la route API) l'appli Node démarrée sur http://localhost:5000
 *        cd Fitnessapp/fitness-app
 *        npm run dev
 *
 * Usage :
 *   node TESTER_INTEGRATION_SOAP.js           -> teste le service SOAP uniquement
 *   node TESTER_INTEGRATION_SOAP.js --route   -> teste + la route /api/medical/profile (upsert MongoDB)
 *                                               + POST /api/medical/validate-program (restrictions)
 *
 * Code de sortie : 0 = tout passe, 1 = au moins un test échoue.
 */

require('dotenv').config();
const soap = require('soap');
const mongoose = require('mongoose');
const Utilisateur = require('./backend/models/Utilisateur');
const MedicalProfile = require('./backend/models/MedicalProfile');
const Exercice = require('./backend/models/Exercice');
const Seance = require('./backend/models/Seance');
const DetailSeance = require('./backend/models/DetailSeance');
const Programme = require('./backend/models/Programme');
const medicalSoapService = require('./backend/services/medicalSoapService');

const WSDL_URL = process.env.MEDICAL_WSDL_URL || 'http://localhost:8080/ws/mon-service.wsdl';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-app';
const API_URL = 'http://localhost:5000';

const TESTER_ROUTE = process.argv.includes('--route');

let nbPass = 0;
let nbFail = 0;

const ok = (label, detail = '') => { nbPass++; console.log(`  [PASS] ${label}${detail ? ' — ' + detail : ''}`); };
const ko = (label, detail = '') => { nbFail++; console.log(`  [FAIL] ${label}${detail ? ' — ' + detail : ''}`); };

const verifier = (label, condition, detail = '') =>
  condition ? ok(label, detail) : ko(label, detail);

/* -------------------------------------------------------------------------- */
/* PARTIE 1 — Tests directs du client SOAP                                     */
/* -------------------------------------------------------------------------- */
async function testerSoapDirect() {
  console.log('\n=== PARTIE 1 : Service SOAP (Spring Boot :8080) ===\n');

  // Vérifie que le WSDL répond
  try {
    const client = await soap.createClientAsync(WSDL_URL, { timeout: 8000 });
    ok('WSDL chargé (createClientAsync)', WSDL_URL);
  } catch (err) {
    ko('WSDL chargé (createClientAsync)', err.message);
    console.log('\n>>> Confirmez que Spring Boot tourne sur :8080, puis relancez. <<<\n');
    return;
  }

  // TEST 1 : PAT001 (2 restrictions)
  await (async () => {
    const p = await medicalSoapService.getMedicalClearanceAndRestrictions('PAT001');
    verifier('PAT001 — maxHeartRate = 160', p.maxHeartRate === 160, `reçu ${p.maxHeartRate}`);
    verifier(
      'PAT001 — restrictions KNEE/AVOID_IMPACT + BACK/NO_HEAVY_LIFTING',
      p.jointRestrictions.length === 2 &&
        p.jointRestrictions[0].bodyPart === 'KNEE' &&
        p.jointRestrictions[0].restrictionType === 'AVOID_IMPACT' &&
        p.jointRestrictions[1].bodyPart === 'BACK' &&
        p.jointRestrictions[1].restrictionType === 'NO_HEAVY_LIFTING',
      JSON.stringify(p.jointRestrictions)
    );
    verifier('PAT001 — allowedExercises = EX001, EX003', JSON.stringify(p.allowedExercises) === JSON.stringify(['EX001', 'EX003']));
    verifier(
      'PAT001 — clearanceExpiryDate = 2027-12-31',
      p.clearanceExpiryDate.toISOString().slice(0, 10) === '2027-12-31',
      p.clearanceExpiryDate.toISOString()
    );
  })();

  // TEST 2 : PAT002 (1 restriction)
  await (async () => {
    const p = await medicalSoapService.getMedicalClearanceAndRestrictions('PAT002');
    verifier('PAT002 — maxHeartRate = 150', p.maxHeartRate === 150, `reçu ${p.maxHeartRate}`);
    verifier(
      'PAT002 — restriction SHOULDER/NO_HEAVY_LIFTING',
      p.jointRestrictions.length === 1 &&
        p.jointRestrictions[0].bodyPart === 'SHOULDER' &&
        p.jointRestrictions[0].restrictionType === 'NO_HEAVY_LIFTING',
      JSON.stringify(p.jointRestrictions)
    );
    verifier('PAT002 — allowedExercises = EX002, EX004, EX006', JSON.stringify(p.allowedExercises) === JSON.stringify(['EX002', 'EX004', 'EX006']));
    verifier(
      'PAT002 — clearanceExpiryDate = 2027-06-30',
      p.clearanceExpiryDate.toISOString().slice(0, 10) === '2027-06-30',
      p.clearanceExpiryDate.toISOString()
    );
  })();

  // TEST 3 : PAT999 (patient inexistant -> SOAP Fault)
  await (async () => {
    try {
      await medicalSoapService.getMedicalClearanceAndRestrictions('PAT999');
      ko('PAT999 — SOAP Fault détectée', 'aucune erreur renvoyée');
    } catch (err) {
      verifier(
        'PAT999 — SOAP Fault détectée',
        err.kind === 'SOAP_FAULT',
        `${err.kind} : ${err.message}`
      );
    }
  })();
}

/* -------------------------------------------------------------------------- */
/* PARTIE 2 — Route API : SOAP -> medicalSoapService -> MongoDB (upsert)      */
/* -------------------------------------------------------------------------- */
async function requeteHttp(method, chemin, body, token) {
  const res = await fetch(`${API_URL}${chemin}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, json: await res.json() };
}

async function testerRoute() {
  console.log('\n=== PARTIE 2 : Route GET /api/medical/profile (Node :5000 -> SOAP -> MongoDB) ===\n');

  // Utilitaires de test en base + utilisateur lié à PAT001
  const user = await Utilisateur.findOne({ email: 'med@example.com' });
  const testUser = user || new Utilisateur({
    nom: 'Patient test',
    email: 'med@example.com',
    motDePasse: 'Password123',
    role: 'sportif'
  });
  testUser.patientExternalId = 'PAT001';
  await testUser.save();
  ok('Utilisateur de test prêt', `med@example.com -> patientExternalId=PAT001`);

  try {
    // Login
    const login = await requeteHttp('POST', '/api/auth/login', { email: 'med@example.com', motDePasse: 'Password123' });
    if (!login.json.token) {
      ko('Login JWT', `HTTP ${login.status} : ${JSON.stringify(login.json)}`);
      return;
    }
    ok('Login JWT');

    // Appel de la route protégée
    const rep = await requeteHttp('GET', '/api/medical/profile', null, login.json.token);
    verifier('Route /api/medical/profile — HTTP 200', rep.status === 200, `HTTP ${rep.status}`);
    verifier('Route — maxHeartRate = 160', rep.json.data?.maxHeartRate === 160, JSON.stringify(rep.json.data?.maxHeartRate));
    verifier('Route — restrictions = KNEE + BACK', rep.json.data?.jointRestrictions?.length === 2, JSON.stringify(rep.json.data?.jointRestrictions));
    verifier('Route — clearanceExpiryDate = 2027-12-31', rep.json.data?.clearanceExpiryDate === '2027-12-31', rep.json.data?.clearanceExpiryDate);

    // Vérification MongoDB : le MedicalProfile a bien été créé/mis à jour (upsert)
    const profil = await MedicalProfile.findOne({ userId: testUser._id }).lean();
    verifier('MongoDB — MedicalProfile présent (upsert)', !!profil, profil ? profil._id.toString() : 'absent');
    verifier('MongoDB — patientExternalId = PAT001', profil?.patientExternalId === 'PAT001', profil?.patientExternalId);
    verifier('MongoDB — clearanceExpiryDate = 2027-12-31', profil?.clearanceExpiryDate?.toISOString().slice(0, 10) === '2027-12-31', profil?.clearanceExpiryDate?.toISOString());

    // Test SOAP Fault via la route : on passe l'utilisateur sur PAT999 -> 404
    testUser.patientExternalId = 'PAT999';
    await testUser.save();
    const repFault = await requeteHttp('GET', '/api/medical/profile', null, login.json.token);
    verifier('Route PAT999 — HTTP 404 (SOAP Fault)', repFault.status === 404, `HTTP ${repFault.status} : ${repFault.json.message}`);

    // Retour à PAT001 pour laisser un état propre
    testUser.patientExternalId = 'PAT001';
    await testUser.save();
  } catch (err) {
    ko('Appel HTTP vers l\'API Fitness', err.message);
    console.log('\n>>> Confirmez que l\'appli Node tourne sur :5000 (npm run dev), puis relancez avec --route. <<<\n');
  }
}

/* -------------------------------------------------------------------------- */
/* PARTIE 3 — POST /api/medical/validate-program (restrictions → décision)    */
/* -------------------------------------------------------------------------- */
async function testerValiderProgramme() {
  console.log('\n=== PARTIE 3 : POST /api/medical/validate-program (restrictions → AUTORISE/BLOQUE) ===\n');

  const user = await Utilisateur.findOne({ email: 'med@example.com' });
  if (!user) { ko('Utilisateur de test introuvable'); return; }

  const login = await requeteHttp('POST', '/api/auth/login', { email: 'med@example.com', motDePasse: 'Password123' });
  if (!login.json.token) { ko('Login JWT (partie 3)', `HTTP ${login.status}`); return; }
  const token = login.json.token;

  // Objets de test (retirés en fin de partie)
  const exSquat   = await Exercice.create({ nom: 'Squat', categorie: 'musculation', niveauDifficulte: 'intermediaire', muscles: ['quadriceps', 'fessiers'] });
  const exCourse  = await Exercice.create({ nom: 'Course rapide', categorie: 'cardio', niveauDifficulte: 'debutant', muscles: ['jambes'] });
  const exDevCOuche = await Exercice.create({ nom: 'Développé couché', categorie: 'musculation', niveauDifficulte: 'intermediaire', muscles: ['pectoraux'], codeExterne: 'EX002' });
  const exExtensionDos = await Exercice.create({ nom: 'Extension du dos', categorie: 'musculation', niveauDifficulte: 'debutant', muscles: ['dos'], codeExterne: 'EX005' });
  const exGainage = await Exercice.create({ nom: 'Gainage', categorie: 'musculation', niveauDifficulte: 'debutant', muscles: ['abdos'] });
  const exEtireDos = await Exercice.create({ nom: 'Étirement du dos', categorie: 'flexibilite', niveauDifficulte: 'debutant', muscles: ['dos'], codeExterne: 'EX003' });

  const s1 = await Seance.create({ utilisateur: user._id, nom: 'Séance validation 1' });
  const s2 = await Seance.create({ utilisateur: user._id, nom: 'Séance validation 2' });
  const s3 = await Seance.create({ utilisateur: user._id, nom: 'Séance validation 3' });
  await DetailSeance.create([
    { seance: s1._id, exercice: exSquat._id, poidsKg: 0 },
    { seance: s1._id, exercice: exDevCOuche._id, poidsKg: 40 },
    { seance: s1._id, exercice: exGainage._id },
    { seance: s2._id, exercice: exCourse._id },
    { seance: s2._id, exercice: exExtensionDos._id, poidsKg: 0 },
    { seance: s2._id, exercice: exEtireDos._id },
    { seance: s3._id, exercice: exSquat._id, poidsKg: 0 },
    { seance: s3._id, exercice: exGainage._id }
  ]);

  // Scénario 1 : PAT001 (KNEE/AVOID_IMPACT, BACK/NO_HEAVY_LIFTING, allowed EX001/EX003) => BLOQUE
  user.patientExternalId = 'PAT001';
  await user.save();

  let programme = await Programme.create({
    utilisateur_id: user._id,
    nom: 'Programme validation PAT001',
    seances_ids: [s1._id, s2._id]
  });

  let rep = await requeteHttp('POST', '/api/medical/validate-program', { programmeId: programme._id }, token);
  verifier('validate-program PAT001 — HTTP 200', rep.status === 200, `HTTP ${rep.status}`);
  verifier('validate-program PAT001 — decision BLOQUE', rep.json.data?.decision === 'BLOQUE', rep.json.data?.decision);
  verifier('validate-program PAT001 — 6 exercices analysés', rep.json.data?.resume?.exercices === 6, JSON.stringify(rep.json.data?.resume));

  const nomBloque = (nom) => (rep.json.data?.blocages || []).some((b) => b.exerciceNom === nom);
  const nomBloqueRaison = (nom, fragment) =>
    (rep.json.data?.blocages || []).some((b) => b.exerciceNom === nom && b.raisons.join(' | ').includes(fragment));

  verifier('PAT001 — Squat bloqué (KNEE/AVOID_IMPACT)', nomBloqueRaison('Squat', 'KNEE'), '');
  verifier('PAT001 — Course rapide bloquée (cardio à impact)', nomBloqueRaison('Course rapide', 'AVOID_IMPACT'), '');
  verifier('PAT001 — Développé couché bloqué (EX002 non autorisé)', nomBloqueRaison('Développé couché', 'non autorise'), '');
  verifier('PAT001 — Extension du dos bloquée (EX005 non autorisé)', nomBloqueRaison('Extension du dos', 'non autorise'), '');
  verifier('PAT001 — Gainage autorisé', !nomBloque('Gainage'), '');
  verifier('PAT001 — Étirement du dos autorisé (EX003 autorisé, pas de charge lourde)', !nomBloque('Étirement du dos'), '');

  // Scénario 2 : PAT002 (SHOULDER/NO_HEAVY_LIFTING) avec un programme sans conflit => AUTORISE
  user.patientExternalId = 'PAT002';
  await user.save();

  const programmeSimple = await Programme.create({
    utilisateur_id: user._id,
    nom: 'Programme validation PAT002',
    seances_ids: [s3._id]
  });

  rep = await requeteHttp('POST', '/api/medical/validate-program', { programmeId: programmeSimple._id }, token);
  verifier('validate-program PAT002 — decision AUTORISE', rep.json.data?.decision === 'AUTORISE', rep.json.data?.decision);
  verifier('validate-program PAT002 — aucun blocage', rep.json.data?.resume?.bloques === 0, JSON.stringify(rep.json.data?.resume));

  // Nettoyage des objets de test
  await Programme.deleteMany({ _id: { $in: [programme._id, programmeSimple._id] } });
  await DetailSeance.deleteMany({ seance: { $in: [s1._id, s2._id, s3._id] } });
  await Seance.deleteMany({ _id: { $in: [s1._id, s2._id, s3._id] } });
  await Exercice.deleteMany({ _id: { $in: [exSquat._id, exCourse._id, exDevCOuche._id, exExtensionDos._id, exGainage._id, exEtireDos._id] } });
  user.patientExternalId = 'PAT001';
  await user.save();
}

/* -------------------------------------------------------------------------- */
(async () => {
  try {
    await testerSoapDirect();

    mongoose.connection.on('error', (e) => ko('Connexion MongoDB', e.message));
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });

    if (TESTER_ROUTE) {
      await testerRoute();
      await testerValiderProgramme();
    } else {
      console.log('\n[info] Utilisez  node TESTER_INTEGRATION_SOAP.js --route  pour tester aussi les routes /api/medical/* et MongoDB.');
    }
  } catch (err) {
    ko('Exécution globale', err.message);
  } finally {
    try { await mongoose.disconnect(); } catch (_) {}
  }

  console.log(`\n=== RÉSULTAT : ${nbPass} PASS, ${nbFail} FAIL ===\n`);
  process.exit(nbFail ? 1 : 0);
})();