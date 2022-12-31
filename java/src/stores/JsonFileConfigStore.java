package stores;

import com.fasterxml.jackson.databind.ObjectMapper;
import entities.Config;
import entities.ConfigStoreQuery;
import jdk.internal.joptsimple.internal.Strings;
import lombok.SneakyThrows;

import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class JsonFileConfigStore extends ConfigStore {

  private final ObjectMapper mapper = new ObjectMapper();
  private final String path;

  public JsonFileConfigStore(String path) {
    super("json-file");
    this.path = path;
  }

  @Override
  public List<Config> get(List<ConfigStoreQuery> queries) {
    List<Config> storedJsonConfigs = readContent();
    return storedJsonConfigs
      .stream()
      .filter(config -> matchAnyQuery(queries,config))
      .collect(Collectors.toList());
  }

  @Override
  public void set(List<Config> configs) {
    List<Config> storedJsonConfigs = readContent();
    List<Config> combinedConfigs = Stream.concat(configs.stream(), storedJsonConfigs.stream())
      .filter(config -> !Strings.isNullOrEmpty(config.getValue()))
      .distinct()
      .collect(Collectors.toList());
    writeContent(combinedConfigs);
  }

  @SneakyThrows // we can wrap with try/catch for custom exception and messages for better debugging
  private List<Config> readContent() {
    Config[] configs = mapper.readValue(Paths.get(path).toFile(), Config[].class);
    return Arrays
      .stream(configs)
      .collect(Collectors.toList());
  }

  @SneakyThrows // we can wrap with try/catch for custom exception and messages for better debugging
  private void writeContent( List<Config> configs) {
    mapper.writeValue(Paths.get(path).toFile(), configs);
  }

  private boolean matchAnyQuery(List<ConfigStoreQuery> queries, Config config){
    return queries
      .stream()
      .anyMatch(query -> matchQueryAndConfig(query, config));
  }

  private boolean matchQueryAndConfig(ConfigStoreQuery query, Config config) {
    return (query.getKey().equals("*") || query.getKey().equals(config.getKey()))
      && (query.getSchema().equals("*") || query.getSchema().equals(config.getSchema()))
      && (query.getSet().equals("*") || query.getSchema().equals(config.getSet()));
  }
}
