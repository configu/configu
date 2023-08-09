import { promises as fs } from 'fs';
import _ from 'lodash';
import ini from 'ini';
import { ConfigStore, ConfigStoreQuery, Config } from '@configu/ts';

export type IniFileConfigStoreConfiguration = { path: string };

export class IniFileConfigStore extends ConfigStore {
  private readonly path: string;
  constructor({ path }: IniFileConfigStoreConfiguration) {
    super('ini-file');
    this.path = path;
  }

  async read(): Promise<Config[]> {
    const data = await fs.readFile(this.path, 'utf8');
    const iniObject = ini.parse(data);

    return Object.entries(iniObject).flatMap(([set, keyValuePairs]) =>
      Object.entries(keyValuePairs)
        .filter(([, value]) => typeof value === 'string' && !Array.isArray(value))
        .map(([key, value]) => ({ set, key, value: value as string })),
    );
  }

  async write(nextConfigs: Config[]): Promise<void> {
    const iniObject = nextConfigs.reduce<Record<string, Record<string, string>>>((acc, config) => {
      const set = config.set || '';
      if (!acc[set]) {
        acc[set] = {};
      }
      acc[set]![config.key] = config.value;
      return acc;
    }, {});

    const data = ini.stringify(iniObject);
    await fs.writeFile(this.path, data);
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const storedConfigs = await this.read();
    return storedConfigs.filter((config) => queries.some(({ set, key }) => set === config.set && key === config.key));
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
