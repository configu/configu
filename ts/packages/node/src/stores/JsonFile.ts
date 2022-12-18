import { promises as fs } from 'fs';
import _ from 'lodash';
import { ConfigStore, ConfigStoreQuery, Config } from '@configu/ts';

export class JsonFileStore extends ConfigStore {
  constructor(public path: string) {
    super('json-file');
  }

  async read(): Promise<Config[]> {
    const data = await fs.readFile(this.path, 'utf8');
    return ConfigStore.parse(data);
  }

  async write(nextConfigs: Config[]): Promise<void> {
    const data = ConfigStore.serialize(nextConfigs);
    await fs.writeFile(this.path, data);
  }

  async get(query: ConfigStoreQuery[]): Promise<Config[]> {
    const storedConfigs = await this.read();

    return storedConfigs.filter((config) => {
      return query.some(({ set, schema, key }) => {
        return (
          (set === '*' || set === config.set) &&
          (schema === '*' || schema === config.schema) &&
          (key === '*' || key === config.key)
        );
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    const storedConfigs = await this.read();

    const nextConfigs = _([...configs, ...storedConfigs])
      .uniqBy((config) => `${config.set}.${config.schema}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();

    await this.write(nextConfigs);
  }
}
