import { promises as fs } from 'fs';
import _ from 'lodash';
import ini from 'ini';
import { ConfigStore, ConfigStoreQuery, Config, Convert } from '@configu/ts';

export type IniFileConfigStoreConfiguration = { path: string };

export class IniFileConfigStore extends ConfigStore {
  private readonly path: string;
  constructor({ path }: IniFileConfigStoreConfiguration) {
    super('ini-file');
    this.path = path;
  }

  async read(): Promise<Config[]> {
    const data = await fs.readFile(this.path, 'utf8');
    const jsonData = JSON.stringify(ini.parse(data));
    return Convert.toConfigStoreContents(jsonData);
  }

  async write(nextConfigs: Config[]): Promise<void> {
    const jsonData = Convert.configStoreContentsToJson(nextConfigs);
    const data = ini.stringify(JSON.parse(jsonData));
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
