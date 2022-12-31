package stores;

import entities.Config;
import entities.ConfigStoreQuery;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor
public abstract class ConfigStore {

  @Getter
  private final String type;

  public abstract List<Config> get(List<ConfigStoreQuery> queries);
  public abstract void set(List<Config> configs);

}
