import _ from 'lodash';
import { Config } from '../Config';
import { ConfigStore, ConfigQuery } from '../ConfigStore';

export class InMemoryConfigStore extends ConfigStore {
  private data: { [ConfigSet: string]: { [ConfigKey: string]: Config } } = {};

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    return _.chain(queries)
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
