import { promises as fs } from 'fs';
import _ from 'lodash';
import { ConfigStore, ConfigStoreQuery, Config, Convert } from '@configu/ts';

export class JsonFileStore extends ConfigStore {
  constructor(public path: string) {
    super('json-file');
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
        return (set === '*' || set === config.set) && (key === '*' || key === config.key);
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
