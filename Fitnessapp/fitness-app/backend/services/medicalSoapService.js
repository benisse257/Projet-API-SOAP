/**
 * Service client SOAP — FitTracker
 * Adapter vers le serveur legacy-medical-api (Spring Boot / WS SOAP).
 * Rôles :
 *  1. charger le WSDL (soap.createClientAsync)
 *  2. appeler l'opération GetMedicalClearanceAndRestrictions
 *  3. mapper la réponse XML -> objet JavaScript/JSON
 *  4. valider la structure avant sauvegarde
 *  5. gérer les erreurs (SOAP Fault, serveur arrêté, réponse inattendue)
 *
 * Aucune logique métier médicale ici : elle reste dans Spring Boot.
 */

const soap = require('soap');

const WSDL_URL = process.env.MEDICAL_WSDL_URL || 'http://localhost:8080/ws/mon-service.wsdl';
const SOAP_TIMEOUT = Number(process.env.MEDICAL_SOAP_TIMEOUT || 8000);

/**
 * Convertit une valeur en tableau (gère le cas où SOAP renvoie 0 ou 1 élément).
 */
const toArray = (value) => {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

/**
 * Extrait la SOAP Fault d'une erreur de la bibliothèque soap.
 * @returns {{code: string, message: string} | null}
 */
const extraireFault = (err) => {
  const fault = err && err.root && err.root.Envelope && err.root.Envelope.Body && err.root.Envelope.Body.Fault;
  if (!fault) return null;
  const message =
    (typeof fault.faultstring === 'string' && fault.faultstring) ||
    fault.faultstring?._ ||
    err.message ||
    'SOAP Fault';
  return { code: fault.faultcode || 'SOAP:Fault', message };
};

/**
 * Recherche le medicalProfile dans la structure renvoyée par soap,
 * quelle que soit sa forme (avec ou sans wrapper GetMedicalClearanceAndRestrictionsResponse).
 */
const extraireProfil = (resultat) => {
  const conteneurs = Array.isArray(resultat) ? [resultat, ...resultat.slice(0, 3)] : [resultat];
  for (const c of conteneurs) {
    if (!c || typeof c !== 'object') continue;
    if (c.medicalProfile) return c.medicalProfile;
    if (c.GetMedicalClearanceAndRestrictionsResponse?.medicalProfile) {
      return c.GetMedicalClearanceAndRestrictionsResponse.medicalProfile;
    }
  }
  return null;
};

/**
 * Valide la structure de la réponse SOAP et la mappe vers un objet
 * prêt à être sauvegardé dans MongoDB (MedicalProfile).
 * @throws {Error} kind = 'REPONSE_INATTENDUE' si la structure est invalide
 */
const normaliserProfilMedical = (reponse, patientExternalId) => {
  const profil = extraireProfil(reponse);
  if (!profil || typeof profil !== 'object') {
    throw Object.assign(new Error('Réponse SOAP inattendue : medicalProfile absent'), {
      kind: 'REPONSE_INATTENDUE',
      patientExternalId
    });
  }

  // maxHeartRate doit être un entier
  const maxHeartRate = Number(profil.maxHeartRate);
  if (!Number.isInteger(maxHeartRate) || maxHeartRate <= 0) {
    throw Object.assign(new Error('Réponse SOAP inattendue : maxHeartRate invalide'), {
      kind: 'REPONSE_INATTENDUE',
      patientExternalId
    });
  }

  // clearancesExpiryDate : xs:date -> Date JavaScript -> MongoDB
  const dateRaw = profil.clearanceExpiryDate;
  const dateJoue = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);
  if (!dateRaw || isNaN(dateJoue.getTime())) {
    throw Object.assign(new Error('Réponse SOAP invalide : clearanceExpiryDate manquante ou incorrecte'), {
      kind: 'DATE_INVALIDE',
      patientExternalId
    });
  }

  // jointRestrictions : normalise la liste (avec ou sans restriction)
  const jointRestrictions = toArray(profil.jointRestrictions?.jointRestriction).map((r) => ({
    bodyPart: r.bodyPart,
    restrictionType: r.restrictionType
  }));

  // allowedExercises : normalise la liste des identifiants
  const allowedExercises = toArray(profil.allowedExercises?.exerciseId).map(String);

  return {
    patientExternalId,
    maxHeartRate,
    jointRestrictions,
    allowedExercises,
    clearanceExpiryDate: dateJoue,
    lastSyncedAt: new Date()
  };
};

/**
 * Appelle le service SOAP et renvoie le profil médical mappé.
 * @param {string} patientExternalId - Identifiant externe du patient
 * @returns {Promise<Object>} Profil médical normalisé
 * @throws {Error} kind = 'SOAP_FAULT' | 'SOAP_UNAVAILABLE' | 'REPONSE_INATTENDUE' | 'DATE_INVALIDE'
 */
async function getMedicalClearanceAndRestrictions(patientExternalId) {
  let client;
  try {
    client = await soap.createClientAsync(WSDL_URL, { timeout: SOAP_TIMEOUT });
  } catch (err) {
    const fault = extraireFault(err);
    if (fault) {
      throw Object.assign(new Error(fault.message), {
        kind: 'SOAP_FAULT',
        code: fault.code,
        patientExternalId
      });
    }
    throw Object.assign(
      new Error(`Service médical injoignable (${WSDL_URL}) : ${err.message}`),
      { kind: 'SOAP_UNAVAILABLE', patientExternalId }
    );
  }

  try {
    // La bibliothèque soap expose l'opération exacte du WSDL (nom du portType)
    const result = await client.GetMedicalClearanceAndRestrictionsAsync({ patientExternalId });
    return normaliserProfilMedical(result, patientExternalId);
  } catch (err) {
    if (err.kind) throw err; // Erreur déjà normalisée (REPONSE_INATTENDUE, DATE_INVALIDE...)
    const fault = extraireFault(err);
    if (fault) {
      throw Object.assign(new Error(fault.message), {
        kind: 'SOAP_FAULT',
        code: fault.code,
        patientExternalId
      });
    }
    throw Object.assign(
      new Error(`Erreur lors de l'appel SOAP : ${err.message}`),
      { kind: 'SOAP_UNAVAILABLE', patientExternalId }
    );
  }
}

module.exports = { getMedicalClearanceAndRestrictions };