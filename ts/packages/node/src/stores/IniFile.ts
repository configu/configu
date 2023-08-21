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

    return Object.entries(iniObject).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        return { set: '', key, value };
      }
      if (_.isPlainObject(value)) {
        return _(Object.entries(value))
          .filter(([, innerValue]) => typeof innerValue === 'string')
          .map(([innerKey, innerValue]) => ({
            set: key,
            key: innerKey,
            value: innerValue as string,
          }))
          .value();
      }
      return [];
    });
  }

  async write(nextConfigs: Config[]): Promise<void> {
    const groupedConfigs = _(nextConfigs)
      .groupBy('set')
      .mapValues((setConfigs) => _.merge({}, ...setConfigs.map((config) => ({ [config.key]: config.value }))))
      .value();
    const rootConfigs = groupedConfigs[''];
    const iniObject = _.merge(rootConfigs, _.omit(groupedConfigs, ''));

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
