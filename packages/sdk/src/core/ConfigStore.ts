import _ from 'lodash';
import { Config } from './Config';

export type ConfigQuery = Pick<Config, 'set' | 'key'>;

// eslint-disable-next-line no-use-before-define
// export type ConfigStoreConstructor = Constructor<ConfigStore>;

export interface ConfigStoreConstructor {
  // eslint-disable-next-line no-use-before-define
  new (configuration?: Record<string, unknown>): ConfigStore;
  type: string;
}

/**
 * A storage engine interface for `Config`s records.
 * https://configu.com/docs/config-store/
 */
export abstract class ConfigStore {
  static deterministicType(type: string) {
    return _.camelCase(type).toLowerCase();
  }

  static getTypeByName(name: string) {
    if (!name.endsWith(ConfigStore.name)) {
      throw new Error(`ConfigStore class name must end with "${ConfigStore.name}". (${name})`);
    }
    const nameWithoutSuffix = name.slice(0, -ConfigStore.name.length);
    const type = ConfigStore.deterministicType(nameWithoutSuffix);
    return type;
  }

  static get type() {
    return ConfigStore.getTypeByName(this.name);
  }

  async init() {}
  abstract get(queries: ConfigQuery[]): Promise<Config[]>;
  abstract set(configs: Config[]): Promise<void>;
}
