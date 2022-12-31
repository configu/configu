package entities;

import com.fasterxml.jackson.annotation.*;

/**
 * An interface of a <uid>.cfgu.[json|yaml] file, aka ConfigSchema
 * that contains binding records between a unique Config <key> and its Cfgu declaration
 */
@lombok.Data
public class ConfigSchema {
    @lombok.Getter(onMethod_ = {@JsonProperty("contents")})
    @lombok.Setter(onMethod_ = {@JsonProperty("contents")})
    private String contents;
    @lombok.Getter(onMethod_ = {@JsonProperty("path")})
    @lombok.Setter(onMethod_ = {@JsonProperty("path")})
    private String path;
    @lombok.Getter(onMethod_ = {@JsonProperty("type")})
    @lombok.Setter(onMethod_ = {@JsonProperty("type")})
    private ConfigSchemaType type;
    @lombok.Getter(onMethod_ = {@JsonProperty("uid")})
    @lombok.Setter(onMethod_ = {@JsonProperty("uid")})
    private String uid;
}
