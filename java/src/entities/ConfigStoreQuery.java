package entities;

import com.fasterxml.jackson.annotation.*;

@lombok.Data
public class ConfigStoreQuery {
    @lombok.Getter(onMethod_ = {@JsonProperty("key")})
    @lombok.Setter(onMethod_ = {@JsonProperty("key")})
    private String key;
    @lombok.Getter(onMethod_ = {@JsonProperty("schema")})
    @lombok.Setter(onMethod_ = {@JsonProperty("schema")})
    private String schema;
    @lombok.Getter(onMethod_ = {@JsonProperty("set")})
    @lombok.Setter(onMethod_ = {@JsonProperty("set")})
    private String set;
}
