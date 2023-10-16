import { promises as fs } from 'fs';
import _ from 'lodash';
import { ConfigStore, type ConfigStoreQuery, type Config, Convert } from '@configu/ts';

export type JsonFileConfigStoreConfiguration = { path: string };

export class JsonFileConfigStore extends ConfigStore {
  private readonly path: string;
  constructor({ path }: JsonFileConfigStoreConfiguration) {
    super('json-file');
    this.path = path;
  }

  async read(): Promise<Config[]> {
    const data = await fs.readFile(this.path, 'utf8');
    return Convert.toConfigStoreContents(data);
  }

  async write(nextConfigs: Config[]): Promise<void> {
    const data = Convert.configStoreContentsToJson(nextConfigs);
    await fs.writeFile(this.path, data);
  }

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
