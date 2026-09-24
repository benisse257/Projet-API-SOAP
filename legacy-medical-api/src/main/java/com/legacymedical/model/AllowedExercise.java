package com.legacymedical.model;

import jakarta.persistence.*;

/**
 * Décision B (documentée dans le rapport) : le sujet ne fournit aucune
 * table d'exercices pour alimenter le champ allowedExercises de la réponse SOAP.
 * Cette table minimale permet de rendre ce champ fonctionnel.
 */
@Entity
@Table(name = "allowed_exercise")
public class AllowedExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_record_id", nullable = false)
    private PatientRecord patientRecord;

    @Column(name = "exercise_id")
    private String exerciseId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PatientRecord getPatientRecord() {
        return patientRecord;
    }

    public void setPatientRecord(PatientRecord patientRecord) {
        this.patientRecord = patientRecord;
    }

    public String getExerciseId() {
        return exerciseId;
    }

    public void setExerciseId(String exerciseId) {
        this.exerciseId = exerciseId;
    }
}