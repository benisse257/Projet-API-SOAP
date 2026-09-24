package com.legacymedical.config;

import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.ws.config.annotation.EnableWs;
import org.springframework.ws.transport.http.MessageDispatcherServlet;
import org.springframework.ws.wsdl.wsdl11.DefaultWsdl11Definition;
import org.springframework.xml.xsd.SimpleXsdSchema;

/**
 * Configuration Web Services SOAP.
 * Expose le WSDL a : http://localhost:8080/ws/mon-service.wsdl (nom du bean = "mon-service").
 */
@EnableWs
@Configuration
public class WebServiceConfig {

    /**
     * Servlet Spring WS : capture toutes les requetes SOAP recues sur /ws/*
     * et les route vers l'Endpoint annote @PayloadRoot.
     */
    @Bean
    public ServletRegistrationBean<MessageDispatcherServlet> messageDispatcherServlet(ApplicationContext applicationContext) {
        MessageDispatcherServlet servlet = new MessageDispatcherServlet();
        servlet.setApplicationContext(applicationContext);
        servlet.setTransformWsdlLocations(true);
        return new ServletRegistrationBean<>(servlet, "/ws/*");
    }

    /**
     * Generateur du WSDL a partir du XSD.
     * Le nom du bean ("mon-service") determine l'URL publique du WSDL.
     */
    @Bean(name = "mon-service")
    public DefaultWsdl11Definition defaultWsdl11Definition(SimpleXsdSchema medicalClearanceSchema) {
        DefaultWsdl11Definition definition = new DefaultWsdl11Definition();
        definition.setPortTypeName("MedicalClearancePort");
        definition.setLocationUri("/ws");
        definition.setTargetNamespace("http://legacymedical.com/ws");
        definition.setSchema(medicalClearanceSchema);
        return definition;
    }

    /** Charge le XSD du contrat (medical-clearance.xsd). */
    @Bean
    public SimpleXsdSchema medicalClearanceSchema() {
        return new SimpleXsdSchema(new ClassPathResource("xsd/medical-clearance.xsd"));
    }
}