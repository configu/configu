package io.quicktype;

import com.fasterxml.jackson.annotation.*;

/**
 * An interface of a path in an hierarchy, aka ConfigSet
 * that contains Config <value> permutation
 */
public class ConfigSet {
    private String[] hierarchy;
    private String path;

    @JsonProperty("hierarchy")
    public String[] getHierarchy() { return hierarchy; }
    @JsonProperty("hierarchy")
    public void setHierarchy(String[] value) { this.hierarchy = value; }

    @JsonProperty("path")
    public String getPath() { return path; }
    @JsonProperty("path")
    public void setPath(String value) { this.path = value; }
}
