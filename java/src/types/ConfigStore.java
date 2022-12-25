package io.quicktype;

import com.fasterxml.jackson.annotation.*;

/**
 * An interface of a storage, aka ConfigStore
 * that contains Config records (Config[])
 */
public class ConfigStore {
    private String type;

    @JsonProperty("type")
    public String getType() { return type; }
    @JsonProperty("type")
    public void setType(String value) { this.type = value; }
}
