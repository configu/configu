package entities;

import com.fasterxml.jackson.annotation.*;

/**
 * A generic representation of a software configuration, aka Config
 */
@lombok.Data
public class Config {
    @lombok.Getter(onMethod_ = {@JsonProperty("key")})
    @lombok.Setter(onMethod_ = {@JsonProperty("key")})
    private String key;
    @lombok.Getter(onMethod_ = {@JsonProperty("schema")})
    @lombok.Setter(onMethod_ = {@JsonProperty("schema")})
    private String schema;
    @lombok.Getter(onMethod_ = {@JsonProperty("set")})
    @lombok.Setter(onMethod_ = {@JsonProperty("set")})
    private String set;
    @lombok.Getter(onMethod_ = {@JsonProperty("value")})
    @lombok.Setter(onMethod_ = {@JsonProperty("value")})
    private String value;
}
