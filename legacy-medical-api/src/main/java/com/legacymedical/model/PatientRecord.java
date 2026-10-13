package com.legacymedical.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "patient_record")
public class PatientRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_external_id", unique = true, nullable = false)
    private String patientExternalId;

    @Column(name = "max_heart_rate")
    private Integer maxHeartRate;

    @Column(name = "clearance_expiry_date")
    private LocalDate clearanceExpiryDate;

    @OneToMany(mappedBy = "patientRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicalRestriction> restrictions = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPatientExternalId() {
        return patientExternalId;
    }

    public void setPatientExternalId(String patientExternalId) {
        this.patientExternalId = patientExternalId;
    }

    public Integer getMaxHeartRate() {
        return maxHeartRate;
    }

    public void setMaxHeartRate(Integer maxHeartRate) {
        this.maxHeartRate = maxHeartRate;
    }

    public LocalDate getClearanceExpiryDate() {
        return clearanceExpiryDate;
    }

    public void setClearanceExpiryDate(LocalDate clearanceExpiryDate) {
        this.clearanceExpiryDate = clearanceExpiryDate;
    }

    public List<MedicalRestriction> getRestrictions() {
        return restrictions;
    }

    public void setRestrictions(List<MedicalRestriction> restrictions) {
        this.restrictions = restrictions;
    }

}