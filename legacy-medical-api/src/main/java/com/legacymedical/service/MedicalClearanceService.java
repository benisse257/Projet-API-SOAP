package com.legacymedical.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.legacymedical.model.AllowedExercise;
import com.legacymedical.model.MedicalRestriction;
import com.legacymedical.model.PatientRecord;
import com.legacymedical.model.RestrictionType;
import com.legacymedical.repository.PatientRecordRepository;
import com.legacymedical.ws.AllowedExercises;
import com.legacymedical.ws.GetMedicalClearanceAndRestrictionsResponse;
import com.legacymedical.ws.JointRestriction;
import com.legacymedical.ws.JointRestrictions;
import com.legacymedical.ws.MedicalProfile;

/**
 * Service métier du legacy-medical-api.
 * Adapte les donnees SQL (entites JPA) vers le contrat SOAP (classes generees du XSD).
 * L'Endpoint SOAP ne contient aucune logique metier (regle d'or du sujet).
 */
@Service
public class MedicalClearanceService {

    private final PatientRecordRepository repository;

    public MedicalClearanceService(PatientRecordRepository repository) {
        this.repository = repository;
    }

    /**
     * @Transactional(readOnly = true) : garde la session Hibernate ouverte pendant
     * tout le mapping pour pouvoir lire les collections lazy (restrictions,
     * allowedExercises) sur le PatientRecord.
     */
    @Transactional(readOnly = true)
    public GetMedicalClearanceAndRestrictionsResponse getMedicalClearanceAndRestrictions(String patientExternalId) {
        PatientRecord record = repository.findByPatientExternalId(patientExternalId)
                .orElseThrow(() -> new PatientNotFoundException("Patient inexistant : " + patientExternalId));

        GetMedicalClearanceAndRestrictionsResponse response = new GetMedicalClearanceAndRestrictionsResponse();
        MedicalProfile profile = new MedicalProfile();

        // maxHeartRate : entite JPA -> contrat SOAP
        profile.setMaxHeartRate(record.getMaxHeartRate());

        // clearanceExpiryDate : LocalDate (entite) -> LocalDate (xsd:date via binding JAXB)
        profile.setClearanceExpiryDate(record.getClearanceExpiryDate());

        // jointRestrictions : liste des parties du corps avec leur type de restriction
        JointRestrictions restrictions = new JointRestrictions();
        for (MedicalRestriction restriction : record.getRestrictions()) {
            JointRestriction joint = new JointRestriction();
            joint.setBodyPart(restriction.getBodyPart());
            joint.setRestrictionType(toWsRestrictionType(restriction.getRestrictionType()));
            restrictions.getJointRestriction().add(joint);
        }
        profile.setJointRestrictions(restrictions);

        // allowedExercises : liste des exercices autorises (decision B documentee dans le rapport)
        AllowedExercises exercises = new AllowedExercises();
        for (AllowedExercise exercise : record.getAllowedExercises()) {
            exercises.getExerciseId().add(exercise.getExerciseId());
        }
        profile.setAllowedExercises(exercises);

        response.setMedicalProfile(profile);
        return response;
    }

    /**
     * Convertit l'enum JPA (com.legacymedical.model.RestrictionType) vers
     * l'enum du contrat SOAP (com.legacymedical.ws.RestrictionType).
     */
    private com.legacymedical.ws.RestrictionType toWsRestrictionType(RestrictionType type) {
        return switch (type) {
            case AVOID_IMPACT -> com.legacymedical.ws.RestrictionType.AVOID_IMPACT;
            case NO_HEAVY_LIFTING -> com.legacymedical.ws.RestrictionType.NO_HEAVY_LIFTING;
        };
    }
}