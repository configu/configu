package io.quicktype;

import com.fasterxml.jackson.annotation.*;

/**
 * A generic representation of a software configuration, aka Config
 */
public class Config {
    private String key;
    private String schema;
    private String set;
    private String value;

    @JsonProperty("key")
    public String getKey() { return key; }
    @JsonProperty("key")
    public void setKey(String value) { this.key = value; }

    @JsonProperty("schema")
    public String getSchema() { return schema; }
    @JsonProperty("schema")
    public void setSchema(String value) { this.schema = value; }

    @JsonProperty("set")
    public String getSet() { return set; }
    @JsonProperty("set")
    public void setSet(String value) { this.set = value; }

    @JsonProperty("value")
    public String getValue() { return value; }
    @JsonProperty("value")
    public void setValue(String value) { this.value = value; }
}
