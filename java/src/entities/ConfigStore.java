package entities;

import com.fasterxml.jackson.annotation.*;

/**
 * An interface of a storage, aka stores.ConfigStore
 * that contains Config records (Config[])
 */
@lombok.Data
public class ConfigStore {
    @lombok.Getter(onMethod_ = {@JsonProperty("type")})
    @lombok.Setter(onMethod_ = {@JsonProperty("type")})
    private String type;
}
