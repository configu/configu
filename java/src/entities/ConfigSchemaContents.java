package entities;

import com.fasterxml.jackson.annotation.*;
import java.util.List;

@lombok.Data
public class ConfigSchemaContents {
    @lombok.Getter(onMethod_ = {@JsonProperty("default")})
    @lombok.Setter(onMethod_ = {@JsonProperty("default")})
    private String configSchemaContentsValueDefault;
    @lombok.Getter(onMethod_ = {@JsonProperty("depends")})
    @lombok.Setter(onMethod_ = {@JsonProperty("depends")})
    private List<String> depends;
    @lombok.Getter(onMethod_ = {@JsonProperty("description")})
    @lombok.Setter(onMethod_ = {@JsonProperty("description")})
    private String description;
    @lombok.Getter(onMethod_ = {@JsonProperty("pattern")})
    @lombok.Setter(onMethod_ = {@JsonProperty("pattern")})
    private String pattern;
    @lombok.Getter(onMethod_ = {@JsonProperty("required")})
    @lombok.Setter(onMethod_ = {@JsonProperty("required")})
    private Boolean required;
    @lombok.Getter(onMethod_ = {@JsonProperty("template")})
    @lombok.Setter(onMethod_ = {@JsonProperty("template")})
    private String template;
    @lombok.Getter(onMethod_ = {@JsonProperty("type")})
    @lombok.Setter(onMethod_ = {@JsonProperty("type")})
    private CfguType type;
}
