package io.quicktype;

import com.fasterxml.jackson.annotation.*;

/**
 * An interface of a <uid>.cfgu.[json|yaml] file, aka ConfigSchema
 * that contains binding records between a unique Config <key> and its Cfgu declaration
 */
public class ConfigSchema {
    private String contents;
    private String path;
    private ConfigSchemaType type;
    private String uid;

    @JsonProperty("contents")
    public String getContents() { return contents; }
    @JsonProperty("contents")
    public void setContents(String value) { this.contents = value; }

    @JsonProperty("path")
    public String getPath() { return path; }
    @JsonProperty("path")
    public void setPath(String value) { this.path = value; }

    @JsonProperty("type")
    public ConfigSchemaType getType() { return type; }
    @JsonProperty("type")
    public void setType(ConfigSchemaType value) { this.type = value; }

    @JsonProperty("uid")
    public String getUid() { return uid; }
    @JsonProperty("uid")
    public void setUid(String value) { this.uid = value; }
}
