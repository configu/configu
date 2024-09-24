import _ from 'lodash';
import { ConfigStore, ConfigQuery, Config } from '../core/ConfigStore';

export class InMemoryConfigStore extends ConfigStore {
  private data: { [ConfigSet: string]: { [ConfigKey: string]: Config } } = {};

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    return _(queries)
      .map(({ set, key }) => _.get(this.data, [set, key], { set, key, value: '' }))
      .filter('value')
      .value();
  }

  async set(configs: Config[]): Promise<void> {
    configs.forEach((config) => {
      if (!config.value) {
        _.unset(this.data, [config.set, config.key]);
      }
      _.set(this.data, [config.set, config.key], config);
    });
  }
}
