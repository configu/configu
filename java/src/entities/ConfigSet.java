package entities;

import com.fasterxml.jackson.annotation.*;
import java.util.List;

/**
 * An interface of a path in an hierarchy, aka ConfigSet
 * that contains Config <value> permutation
 */
@lombok.Data
public class ConfigSet {
    @lombok.Getter(onMethod_ = {@JsonProperty("hierarchy")})
    @lombok.Setter(onMethod_ = {@JsonProperty("hierarchy")})
    private List<String> hierarchy;
    @lombok.Getter(onMethod_ = {@JsonProperty("path")})
    @lombok.Setter(onMethod_ = {@JsonProperty("path")})
    private String path;
}
