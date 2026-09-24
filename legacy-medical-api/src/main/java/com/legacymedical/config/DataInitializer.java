package com.legacymedical.config;

import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.legacymedical.model.AllowedExercise;
import com.legacymedical.model.MedicalRestriction;
import com.legacymedical.model.PatientRecord;
import com.legacymedical.model.RestrictionType;
import com.legacymedical.repository.PatientRecordRepository;

/**
 * Donnees de test (validees avec le groupe).
 * PAT999 est volontairement ABSENT : sert a tester la SOAP Fault.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final PatientRecordRepository repository;

    public DataInitializer(PatientRecordRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }

        PatientRecord pat001 = new PatientRecord();
        pat001.setPatientExternalId("PAT001");
        pat001.setMaxHeartRate(160);
        pat001.setClearanceExpiryDate(LocalDate.of(2027, 12, 31));
        addRestriction(pat001, "KNEE", RestrictionType.AVOID_IMPACT);
        addRestriction(pat001, "BACK", RestrictionType.NO_HEAVY_LIFTING);
        addAllowedExercise(pat001, "EX001");
        addAllowedExercise(pat001, "EX003");
        repository.save(pat001);

        PatientRecord pat002 = new PatientRecord();
        pat002.setPatientExternalId("PAT002");
        pat002.setMaxHeartRate(150);
        pat002.setClearanceExpiryDate(LocalDate.of(2027, 6, 30));
        addRestriction(pat002, "SHOULDER", RestrictionType.NO_HEAVY_LIFTING);
        addAllowedExercise(pat002, "EX002");
        addAllowedExercise(pat002, "EX004");
        addAllowedExercise(pat002, "EX006");
        repository.save(pat002);

        PatientRecord pat003 = new PatientRecord();
        pat003.setPatientExternalId("PAT003");
        pat003.setMaxHeartRate(165);
        pat003.setClearanceExpiryDate(LocalDate.of(2027, 1, 15));
        addAllowedExercise(pat003, "EX001");
        repository.save(pat003);
    }

    private void addRestriction(PatientRecord record, String bodyPart, RestrictionType type) {
        MedicalRestriction restriction = new MedicalRestriction();
        restriction.setBodyPart(bodyPart);
        restriction.setRestrictionType(type);
        restriction.setPatientRecord(record);
        record.getRestrictions().add(restriction);
    }

    private void addAllowedExercise(PatientRecord record, String exerciseId) {
        AllowedExercise exercise = new AllowedExercise();
        exercise.setExerciseId(exerciseId);
        exercise.setPatientRecord(record);
        record.getAllowedExercises().add(exercise);
    }
}