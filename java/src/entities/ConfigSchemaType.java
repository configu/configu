package entities;

import java.io.IOException;
import com.fasterxml.jackson.annotation.*;

public enum ConfigSchemaType {
    JSON, YAML;

    @JsonValue
    public String toValue() {
        switch (this) {
            case JSON: return "json";
            case YAML: return "yaml";
        }
        return null;
    }

    @JsonCreator
    public static ConfigSchemaType forValue(String value) throws IOException {
        if (value.equals("json")) return JSON;
        if (value.equals("yaml")) return YAML;
        throw new IOException("Cannot deserialize ConfigSchemaType");
    }
}
