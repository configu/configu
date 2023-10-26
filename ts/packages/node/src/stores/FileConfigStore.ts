import { type Config, ConfigStore, type ConfigStoreQuery } from '@configu/ts';
import _ from 'lodash';

export abstract class FileConfigStore extends ConfigStore {
  readonly path: string;
  constructor(type: string, path: string) {
    super(type);
    this.path = path;
  }

  // * All file config stores should create the file with the required "empty state" in case it does not exist
  abstract init(): Promise<void>;

  // * Reads all the configs from the file
  protected abstract read(): Promise<Config[]>;

  // * Writes the next state of the configs to the file
  protected abstract write(nextConfigs: Config[]): Promise<void>;

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const storedConfigs = await this.read();

    return storedConfigs.filter((config) => {
      return queries.some(({ set, key }) => {
        return set === config.set && key === config.key;
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    const storedConfigs = await this.read();

    const nextConfigs = _([...configs, ...storedConfigs])
      .uniqBy((config) => `${config.set}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();

    await this.write(nextConfigs);
  }
}
