package com.legacymedical.util;

import java.time.LocalDate;

/**
 * Adaptateur JAXB : convertit xs:date <-> java.time.LocalDate
 * (mapping date impose par le sujet : LocalDate -> xsd:date -> JS -> MongoDB)
 */
public final class LocalDateAdapter {

    private LocalDateAdapter() {
    }

    /** xs:date ("2026-09-30") -> LocalDate */
    public static LocalDate parse(String value) {
        return LocalDate.parse(value);
    }

    /** LocalDate -> xs:date ("2026-09-30") */
    public static String print(LocalDate value) {
        return value.toString();
    }
}