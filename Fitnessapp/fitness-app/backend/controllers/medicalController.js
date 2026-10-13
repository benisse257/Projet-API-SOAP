/**
 * Contrôleur médical — FitTracker
 * Adapter vers le serveur SOAP legacy-medical-api (Spring Boot) :
 *  1. identifie l'utilisateur connecté (token JWT)
 *  2. récupère son patientExternalId
 *  3. appelle le service SOAP
 *  4. mappe la réponse (XML -> JSON) côté service
 *  5. enregistre/met à jour le MedicalProfile dans MongoDB (upsert)
 *  6. retourne la réponse JSON
 */

const Utilisateur = require('../models/Utilisateur');
const MedicalProfile = require('../models/MedicalProfile');
const Programme = require('../models/Programme');
const DetailSeance = require('../models/DetailSeance');
const medicalSoapService = require('../services/medicalSoapService');

/**
 * Correspondance medicale -> exercices (regles simples de validation).
 * bodyPart du contrat SOAP -> mots-cles des muscles qui sollicitent l'articulation.
 * NB : la logique medicale reste dans Spring Boot ; ici on ne fait qu'interpreter
 * les donnees medecales deja consommees via SOAP pour l'application Fitness.
 */
const MUSCLES_PAR_ARTICULATION = {
  KNEE: ['genou', 'quadriceps', 'fessier', 'ischio', 'jambe', 'mollet'],
  BACK: ['dos', 'lombaire', 'ischio', 'fessier', 'abdo'],
  SHOULDER: ['epaule', 'deltoide', 'pectoral', 'trapeze'],
  HIP: ['hanche', 'fessier', 'ischio'],
  ANKLE: ['cheville', 'mollet', 'tibial']
};

/** Poids (kg) a partir duquel un mouvement est considere comme une charge lourde. */
const SEUIL_POIDS_LOURD_KG = 20;

/** Normalise un texte : minuscules + suppression des accents. */
const normaliserTexte = (t) =>
  String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Renvoie les muscles d'un exercice qui sollicitent une articulation donnee.
 */
const musclesEnConflit = (muscles, motsCles) => {
  const mots = (motsCles || []).map(normaliserTexte);
  return (muscles || []).filter((m) => {
    const nom = normaliserTexte(m);
    return mots.some((mot) => nom.includes(mot));
  });
};

/**
 * Applique les restrictions medicales (authologiques SOAP) a un exercice du programme.
 * @returns {string[]} liste des raisons de blocage (vide = exercice autorise)
 */
const restrictionsPourExercice = (restrictions, detail, exercice, allowedExercises) => {
  const motifs = [];

  // 1. Liste blanche du contrat SOAP (exercice codeExterne renseigne uniquement)
  const codeExterne = exercice.codeExterne;
  if (codeExterne && allowedExercises?.length > 0 && !allowedExercises.includes(String(codeExterne))) {
    motifs.push(
      `Exercice non autorise par le medecin (allowedExercises : ${(allowedExercises || []).join(', ') || 'aucun'})`
    );
  }

  // 2. Restrictions articulaires
  for (const r of restrictions || []) {
    const motsCles = MUSCLES_PAR_ARTICULATION[String(r.bodyPart).toUpperCase()];
    if (!motsCles) continue;

    const musclesTouches = musclesEnConflit(exercice.muscles, motsCles);
    const poids = Number(detail.poidsKg) || 0;

    if (r.restrictionType === 'AVOID_IMPACT') {
      if (exercice.categorie === 'cardio' || musclesTouches.length > 0) {
        motifs.push(
          `Articulation ${r.bodyPart} (AVOID_IMPACT) : exercice a impact interdit` +
            (musclesTouches.length ? ` (muscles : ${musclesTouches.join(', ')})` : ' (cardio)')
        );
      }
    } else if (r.restrictionType === 'NO_HEAVY_LIFTING' && musclesTouches.length > 0 && poids > SEUIL_POIDS_LOURD_KG) {
      motifs.push(
        `Articulation ${r.bodyPart} (NO_HEAVY_LIFTING) : charge lourde interdite (${poids} kg, muscles : ${musclesTouches.join(', ')})`
      );
    }
  }

  return motifs;
};

/**
 * Récupère (ou crée) le profil médical de l'utilisateur connecté.
 * @route GET /api/medical/profile
 * @returns {Object} Dossier médical synchronisé depuis Spring Boot
 */
exports.getMedicalProfile = async (req, res) => {
  try {
    // 1-2. Identification de l'utilisateur et de son patientExternalId
    const user = await Utilisateur.findById(req.utilisateur.id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    if (!user.patientExternalId) {
      return res.status(400).json({
        success: false,
        message: "Aucun patientExternalId associé à ce compte. Renseignez-le d'abord."
      });
    }

    // 3-4. Appel SOAP + mapping (XML -> JSON) assuré par le service
    let donnees;
    try {
      donnees = await medicalSoapService.getMedicalClearanceAndRestrictions(user.patientExternalId);
    } catch (soapErr) {
      if (soapErr.kind === 'SOAP_FAULT') {
        return res.status(404).json({
          success: false,
          message: soapErr.message || "Aucun dossier médical pour ce patient",
          patientExternalId: user.patientExternalId
        });
      }
      if (soapErr.kind === 'REPONSE_INATTENDUE' || soapErr.kind === 'DATE_INVALIDE') {
        return res.status(502).json({
          success: false,
          message: soapErr.message,
          patientExternalId: user.patientExternalId
        });
      }
      // SOAP_UNAVAILABLE (Spring Boot arrêté ou injoignable)
      return res.status(503).json({
        success: false,
        message: soapErr.message,
        patientExternalId: user.patientExternalId
      });
    }

    // 5. Upsert du MedicalProfile dans MongoDB (un seul profil par utilisateur)
    const profil = await MedicalProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          ...donnees,
          userId: user._id
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // 6. Réponse JSON propre (date au format yyyy-MM-dd)
    res.json({
      success: true,
      data: {
        _id: profil._id,
        userId: profil.userId,
        patientExternalId: profil.patientExternalId,
        maxHeartRate: profil.maxHeartRate,
        jointRestrictions: profil.jointRestrictions,
        allowedExercises: profil.allowedExercises,
        clearanceExpiryDate: profil.clearanceExpiryDate.toISOString().slice(0, 10),
        lastSyncedAt: profil.lastSyncedAt,
        createdAt: profil.createdAt,
        updatedAt: profil.updatedAt
      },
      source: 'SOAP'
    });
  } catch (err) {
    // 7. Erreur MongoDB ou autre erreur interne contrôlée
    res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
};

/**
 * Valide un programme d'entraînement contre les restrictions médicales du sportif
 * (scénario du sujet : « avant de valider un programme intense »).
 *
 * @route POST /api/medical/validate-program
 * @param {string} body.programmeId - Identifiant du programme à valider
 * @returns {Object} Décision AUTORISE/BLOQUE + exercices bloqués avec les raisons
 */
exports.validerProgramme = async (req, res) => {
  try {
    const { programmeId } = req.body;
    if (!programmeId) {
      return res.status(400).json({ success: false, message: 'programmeId est obligatoire.' });
    }

    const programme = await Programme.findById(programmeId).populate('seances_ids', 'nom').lean();
    if (!programme) {
      return res.status(404).json({ success: false, message: 'Programme introuvable.' });
    }
    if (req.utilisateur.role === 'sportif' && String(programme.utilisateur_id) !== req.utilisateur.id) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez valider que vos propres programmes.' });
    }
    if (!programme.seances_ids || programme.seances_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Le programme ne contient aucune séance.' });
    }

    // Sportif concerné (propriétaire du programme) et son identifiant patient legacy
    const athlete = await Utilisateur.findById(programme.utilisateur_id).select('-motDePasse').lean();
    if (!athlete) {
      return res.status(404).json({ success: false, message: 'Sportif associé au programme introuvable.' });
    }
    if (!athlete.patientExternalId) {
      return res.status(400).json({
        success: false,
        message: "Le sportif n'a pas de patientExternalId associé. Renseignez-le d'abord."
      });
    }

    // Données médicales toujours fraîches : remontée SOAP (Spring Boot reste la source de vérité)
    let profil;
    try {
      profil = await medicalSoapService.getMedicalClearanceAndRestrictions(athlete.patientExternalId);
    } catch (soapErr) {
      if (soapErr.kind === 'SOAP_FAULT') {
        return res.status(404).json({ success: false, message: soapErr.message || 'Aucun dossier médical pour ce patient' });
      }
      if (soapErr.kind === 'REPONSE_INATTENDUE' || soapErr.kind === 'DATE_INVALIDE') {
        return res.status(502).json({ success: false, message: soapErr.message });
      }
      return res.status(503).json({ success: false, message: soapErr.message });
    }

    // Règle 0 : clearance expirée = blocage global
    const clearanceExpiree = new Date(profil.clearanceExpiryDate) < new Date();

    // Séances du programme -> détails -> exercices
    const seanceIds = programme.seances_ids.map((s) => s._id);
    const nomSeanceParId = {};
    for (const s of programme.seances_ids) nomSeanceParId[String(s._id)] = s.nom;

    const details = await DetailSeance.find({ seance: { $in: seanceIds } })
      .populate('exercice')
      .lean();

    // Un même exercice peut apparaître dans plusieurs séances : on ne le compte qu'une fois
    const exercicesParId = new Map();
    for (const d of details) {
      if (!d.exercice) continue;
      const id = String(d.exercice._id);
      if (!exercicesParId.has(id)) {
        exercicesParId.set(id, {
          exercice: d.exercice,
          detail: d,
          seanceNom: nomSeanceParId[String(d.seance)] || ''
        });
      }
    }

    // Application des règles exercice par exercice
    const blocages = [];
    for (const { exercice, detail, seanceNom } of exercicesParId.values()) {
      const raisons = restrictionsPourExercice(profil.jointRestrictions, detail, exercice, profil.allowedExercises);
      if (clearanceExpiree) {
        raisons.push(`Clearance médicale expirée le ${profil.clearanceExpiryDate.toISOString().slice(0, 10)} (renouvellement requis)`);
      }
      if (raisons.length > 0) {
        blocages.push({ exerciceId: exercice._id, exerciceNom: exercice.nom, seanceNom, raisons });
      }
    }

    const decision = blocages.length > 0 ? 'BLOQUE' : 'AUTORISE';

    res.json({
      success: true,
      data: {
        programmeId: programme._id,
        programmeNom: programme.nom,
        athlete: { id: athlete._id, nom: athlete.nom, patientExternalId: athlete.patientExternalId },
        profil: {
          maxHeartRate: profil.maxHeartRate,
          clearanceExpiryDate: profil.clearanceExpiryDate.toISOString().slice(0, 10),
          clearanceExpiree,
          jointRestrictions: profil.jointRestrictions,
          allowedExercises: profil.allowedExercises
        },
        decision,
        resume: {
          exercices: exercicesParId.size,
          autorises: exercicesParId.size - blocages.length,
          bloques: blocages.length
        },
        blocages
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
};