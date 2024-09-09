import { Jsonify } from 'type-fest';
import { Config } from './Config';
import { String } from '../utils/String';

export * from './Config';
export type ConfigQuery = Pick<Config, 'set' | 'key'>;

// todo: naming: params | args | options | config ...
// eslint-disable-next-line no-use-before-define
type ConfigStoreConstructor = new (configuration: unknown) => ConfigStore;

/**
 * A storage engine interface for `Config`s records.
 * https://configu.com/docs/config-store/
 */
export abstract class ConfigStore {
  public readonly type: string;
  static readonly index: Record<string, ConfigStoreConstructor> = {};

  constructor() {
    const { name } = this.constructor;
    if (!name.endsWith(ConfigStore.name)) {
      throw new Error(`ConfigStore class name must end with "${ConfigStore.name}"`);
    }
    this.type = name.slice(0, -ConfigStore.name.length);

    String.generateCaseVariations(this.type).forEach((variation) => {
      if (ConfigStore.index[variation]) {
        throw new Error(`ConfigStore type "${variation}" is already registered`);
      }
      ConfigStore.index[variation] = this.constructor as ConfigStoreConstructor;
    });
  }

  async init() {}
  abstract get(queries: ConfigQuery[]): Promise<Config[]>;
  abstract set(configs: Config[]): Promise<void>;
}
