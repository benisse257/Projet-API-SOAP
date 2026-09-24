package com.legacymedical.model;

/**
 * Valeurs autorisées de restriction_type (exactement celles du sujet).
 * Stockées en VARCHAR dans la base via @Enumerated(EnumType.STRING).
 */
public enum RestrictionType {
    AVOID_IMPACT,
    NO_HEAVY_LIFTING
}