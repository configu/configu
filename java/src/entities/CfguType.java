package entities;

import java.io.IOException;
import com.fasterxml.jackson.annotation.*;

public enum CfguType {
    BASE64, BOOLEAN, COLOR, CONNECTION_STRING, COUNTRY, CURRENCY, DOMAIN, EMAIL, HEX, I_PV4, I_PV6, LAT_LONG, LOCALE, MD5, MOBILE_PHONE, NUMBER, REG_EX, SEM_VER, SHA, STRING, URL, UUID;

    @JsonValue
    public String toValue() {
        switch (this) {
            case BASE64: return "Base64";
            case BOOLEAN: return "Boolean";
            case COLOR: return "Color";
            case CONNECTION_STRING: return "ConnectionString";
            case COUNTRY: return "Country";
            case CURRENCY: return "Currency";
            case DOMAIN: return "Domain";
            case EMAIL: return "Email";
            case HEX: return "Hex";
            case I_PV4: return "IPv4";
            case I_PV6: return "IPv6";
            case LAT_LONG: return "LatLong";
            case LOCALE: return "Locale";
            case MD5: return "MD5";
            case MOBILE_PHONE: return "MobilePhone";
            case NUMBER: return "Number";
            case REG_EX: return "RegEx";
            case SEM_VER: return "SemVer";
            case SHA: return "SHA";
            case STRING: return "String";
            case URL: return "URL";
            case UUID: return "UUID";
        }
        return null;
    }

    @JsonCreator
    public static CfguType forValue(String value) throws IOException {
        if (value.equals("Base64")) return BASE64;
        if (value.equals("Boolean")) return BOOLEAN;
        if (value.equals("Color")) return COLOR;
        if (value.equals("ConnectionString")) return CONNECTION_STRING;
        if (value.equals("Country")) return COUNTRY;
        if (value.equals("Currency")) return CURRENCY;
        if (value.equals("Domain")) return DOMAIN;
        if (value.equals("Email")) return EMAIL;
        if (value.equals("Hex")) return HEX;
        if (value.equals("IPv4")) return I_PV4;
        if (value.equals("IPv6")) return I_PV6;
        if (value.equals("LatLong")) return LAT_LONG;
        if (value.equals("Locale")) return LOCALE;
        if (value.equals("MD5")) return MD5;
        if (value.equals("MobilePhone")) return MOBILE_PHONE;
        if (value.equals("Number")) return NUMBER;
        if (value.equals("RegEx")) return REG_EX;
        if (value.equals("SemVer")) return SEM_VER;
        if (value.equals("SHA")) return SHA;
        if (value.equals("String")) return STRING;
        if (value.equals("URL")) return URL;
        if (value.equals("UUID")) return UUID;
        throw new IOException("Cannot deserialize CfguType");
    }
}
