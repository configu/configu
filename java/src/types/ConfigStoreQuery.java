package io.quicktype;

import com.fasterxml.jackson.annotation.*;

public class ConfigStoreQuery {
    private String key;
    private String schema;
    private String set;

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
}
