package com.legacymedical.service;

import org.springframework.ws.soap.server.endpoint.annotation.FaultCode;
import org.springframework.ws.soap.server.endpoint.annotation.SoapFault;

/**
 * Exception métier : patient inexistant.
 * L'annotation @SoapFault indique à Spring WS de la transformer en SOAP Fault
 * (faultcode SENDER + message comme faultstring).
 */
@SoapFault(faultCode = FaultCode.SENDER)
public class PatientNotFoundException extends RuntimeException {

    public PatientNotFoundException(String message) {
        super(message);
    }
}