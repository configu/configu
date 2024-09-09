import _ from 'lodash';
import { ConfigStore, ConfigQuery, Config } from '../core/ConfigStore';

export abstract class ObjectConfigStore extends ConfigStore {
  abstract getData(queries: ConfigQuery[]): Promise<Config[]>;

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    return this.data.filter((config) => {
      return queries.some(({ set, key }) => {
        return set === config.set && key === config.key;
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    this.data = _([...configs, ...this.data])
      .uniqBy((config) => `${config.set}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();
  }
}
