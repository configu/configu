import { Config } from './Config';
import { ConfigKey } from './ConfigKey';

export type ConfigQuery = Pick<Config, 'set' | 'key'>;

// eslint-disable-next-line no-use-before-define
// export type ConfigStoreConstructor = Constructor<ConfigStore>;

export interface ConfigStoreConstructor {
  // eslint-disable-next-line no-use-before-define
  new (configuration: any): ConfigStore;
  type: string;
}

/**
 * A storage engine interface for `Config`s records.
 * https://configu.com/docs/config-store/
 */
export abstract class ConfigStore {
  private static stores = new Map<string, ConfigStoreConstructor>();

  public readonly type: string = this.constructor.name;

  static get type() {
    if (!this.name.endsWith(ConfigStore.name)) {
      throw new Error(`ConfigStore class name must end with "${ConfigStore.name}". (${this.name})`);
    }
    const nameWithoutSuffix = this.name.slice(0, -ConfigStore.name.length);
    const type = ConfigKey.normalize(nameWithoutSuffix);
    return type;
  }

  static register(store: ConfigStoreConstructor) {
    ConfigStore.stores.set(store.type, store);
  }

  static has(type: string) {
    const normalizedType = ConfigKey.normalize(type);
    return ConfigStore.stores.has(normalizedType);
  }

  static construct(type: string, configuration = {}): ConfigStore {
    const TYPE = type.split('@')[0] || '';
    const normalizedType = ConfigKey.normalize(TYPE);
    const StoreCtor = ConfigStore.stores.get(normalizedType);
    if (!StoreCtor) {
      throw new Error(`unknown store type ${type}`);
    }
    return new StoreCtor(configuration);
  }

  async init() {}
  abstract get(queries: ConfigQuery[]): Promise<Config[]>;
  abstract set(configs: Config[]): Promise<void>;
}
