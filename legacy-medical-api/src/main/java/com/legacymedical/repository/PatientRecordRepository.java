package com.legacymedical.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.legacymedical.model.PatientRecord;

public interface PatientRecordRepository extends JpaRepository<PatientRecord, Long> {

    /**
     * Recherche imposée par le sujet : par identifiant externe (patient_external_id).
     */
    Optional<PatientRecord> findByPatientExternalId(String patientExternalId);
}