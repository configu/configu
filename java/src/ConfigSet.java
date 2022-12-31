import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ConfigSet {
  private static final String SEPARATOR = "/";
  private static final String ROOT = "";
  private final ConfigSchema configSchema;
  @Getter
  private final List<String> hierarchy;

  public ConfigSet(String path) {
    if (path.endsWith(SEPARATOR)) {
      throw new RuntimeException(String.format("invalid path %s, path mustn't end with %s character", path, SEPARATOR));
    }
    configSchema = new ConfigSchema();
    List<String> subPaths = extractAllSubPaths(path);
    subPaths.forEach(subPath -> {
      if(!configSchema.validateNaming(subPath)) {
        throw new RuntimeException(String.format("invalid path: %s, path nodes mustn't contain reserved words: %s", path, subPath));
      }
    });
    hierarchy = extractAllSubPaths(path);
  }

  private static List<String> extractAllSubPaths(String path) {
    if(path.equals(ROOT)) {
      return Collections.singletonList(path);
    }
    if(!path.startsWith(SEPARATOR)) {
      throw new RuntimeException(String.format("invalid path, path must start with %s", SEPARATOR));
    }
    List<String> subPaths = new ArrayList<>();
    int startIndex= 0;
    int furtherSeparatorNotExists = -1;
    int positionOfSeparator = 2;
    int indexOfSeparatorInPath = StringUtils.ordinalIndexOf(path, SEPARATOR, positionOfSeparator);
    while(indexOfSeparatorInPath != furtherSeparatorNotExists) {
      String subPath = path.substring(startIndex,indexOfSeparatorInPath);
      positionOfSeparator++;
      indexOfSeparatorInPath = StringUtils.ordinalIndexOf(path, SEPARATOR, positionOfSeparator);
      subPaths.add(subPath);
    }
    subPaths.add(path);
    return subPaths;
  }
}
