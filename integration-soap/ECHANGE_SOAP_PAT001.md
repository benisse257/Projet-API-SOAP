# Echange SOAP complet — PAT001

**Service :** `legacy-medical-api` (Spring Boot / Spring-WS)  
**URL :** `http://localhost:8080/ws`  
**Operation :** `GetMedicalClearanceAndRestrictions`  
**Resultat de l'appel reel :** HTTP 200

## Requete HTTP

```http
POST /ws HTTP/1.1
Host: localhost:8080
Content-Type: text/xml; charset=utf-8
```

## Requete SOAP XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:med="http://legacymedical.com/ws">
   <soapenv:Header/>
   <soapenv:Body>
      <med:GetMedicalClearanceAndRestrictionsRequest>
         <med:patientExternalId>PAT001</med:patientExternalId>
      </med:GetMedicalClearanceAndRestrictionsRequest>
   </soapenv:Body>
</soapenv:Envelope>
```

## Reponse SOAP XML recue de Spring Boot

```xml
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Header/>
  <SOAP-ENV:Body>
    <ns2:GetMedicalClearanceAndRestrictionsResponse xmlns:ns2="http://legacymedical.com/ws">
      <ns2:medicalProfile>
        <ns2:maxHeartRate>160</ns2:maxHeartRate>
        <ns2:jointRestrictions>
          <ns2:jointRestriction>
            <ns2:bodyPart>KNEE</ns2:bodyPart>
            <ns2:restrictionType>AVOID_IMPACT</ns2:restrictionType>
          </ns2:jointRestriction>
          <ns2:jointRestriction>
            <ns2:bodyPart>BACK</ns2:bodyPart>
            <ns2:restrictionType>NO_HEAVY_LIFTING</ns2:restrictionType>
          </ns2:jointRestriction>
        </ns2:jointRestrictions>
        <ns2:allowedExercises/>
        <ns2:clearanceExpiryDate>2027-12-31</ns2:clearanceExpiryDate>
      </ns2:medicalProfile>
    </ns2:GetMedicalClearanceAndRestrictionsResponse>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
```

`allowedExercises` est vide : le sujet impose ce champ dans le contrat, mais ne fournit aucune table SQL pour alimenter la liste. Le service ne fabrique donc pas de donnees pour ce champ.
