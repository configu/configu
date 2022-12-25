package io.quicktype;

import com.fasterxml.jackson.annotation.*;

/**
 * A generic declaration of a Config, aka Cfgu that specifies information about its type and
 * other characteristics
 */
public class Cfgu {
    private String cfguDefault;
    private String[] depends;
    private String description;
    private String pattern;
    private Boolean required;
    private String template;
    private CfguType type;

    @JsonProperty("default")
    public String getCfguDefault() { return cfguDefault; }
    @JsonProperty("default")
    public void setCfguDefault(String value) { this.cfguDefault = value; }

    @JsonProperty("depends")
    public String[] getDepends() { return depends; }
    @JsonProperty("depends")
    public void setDepends(String[] value) { this.depends = value; }

    @JsonProperty("description")
    public String getDescription() { return description; }
    @JsonProperty("description")
    public void setDescription(String value) { this.description = value; }

    @JsonProperty("pattern")
    public String getPattern() { return pattern; }
    @JsonProperty("pattern")
    public void setPattern(String value) { this.pattern = value; }

    @JsonProperty("required")
    public Boolean getRequired() { return required; }
    @JsonProperty("required")
    public void setRequired(Boolean value) { this.required = value; }

    @JsonProperty("template")
    public String getTemplate() { return template; }
    @JsonProperty("template")
    public void setTemplate(String value) { this.template = value; }

    @JsonProperty("type")
    public CfguType getType() { return type; }
    @JsonProperty("type")
    public void setType(CfguType value) { this.type = value; }
}
