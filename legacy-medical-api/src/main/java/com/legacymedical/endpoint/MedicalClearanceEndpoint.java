package com.legacymedical.endpoint;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import com.legacymedical.service.MedicalClearanceService;
import com.legacymedical.ws.GetMedicalClearanceAndRestrictionsRequest;
import com.legacymedical.ws.GetMedicalClearanceAndRestrictionsResponse;

/**
 * Endpoint SOAP expose via /ws/mon-service.wsdl.
 * Le nom d'operation (decision 2 du sujet) est getMedicalClearanceAndRestrictions,
 * son parametre patientExternalId.
 */
@Endpoint
public class MedicalClearanceEndpoint {

    private static final String NAMESPACE_URI = "http://legacymedical.com/ws";

    private final MedicalClearanceService service;

    public MedicalClearanceEndpoint(MedicalClearanceService service) {
        this.service = service;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "GetMedicalClearanceAndRestrictionsRequest")
    @ResponsePayload
    public GetMedicalClearanceAndRestrictionsResponse getMedicalClearanceAndRestrictions(
            @RequestPayload GetMedicalClearanceAndRestrictionsRequest request) {

        return service.getMedicalClearanceAndRestrictions(request.getPatientExternalId());
    }
}