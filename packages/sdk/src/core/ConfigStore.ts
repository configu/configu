import { Config } from './Config';

export * from './Config';
export type ConfigQuery = Pick<Config, 'set' | 'key'>;

// eslint-disable-next-line no-use-before-define
export type ConfigStoreConstructor = new (configuration: object) => ConfigStore;

/**
 * A storage engine interface for `Config`s records.
 * https://configu.com/docs/config-store/
 */
export abstract class ConfigStore {
  public readonly name: string;

  constructor() {
    const { name } = this.constructor;
    if (!name.endsWith(ConfigStore.name)) {
      throw new Error(`ConfigStore class name must end with "${ConfigStore.name}"`);
    }
    this.name = name.slice(0, -ConfigStore.name.length);
  }

  async init() {}
  abstract get(queries: ConfigQuery[]): Promise<Config[]>;
  abstract set(configs: Config[]): Promise<void>;
}
