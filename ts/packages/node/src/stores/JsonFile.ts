import { promises as fs } from 'fs';
import _ from 'lodash';
import { Store, StoreQuery, StoreContents } from '@configu/ts';

export class JsonFileStore extends Store {
  constructor(public path: string) {
    super('json-file');
  }

  async read(): Promise<StoreContents> {
    const data = await fs.readFile(this.path, 'utf8');
    return Store.parse(data);
  }

  async write(nextConfigs: StoreContents): Promise<void> {
    const data = Store.serialize(nextConfigs);
    await fs.writeFile(this.path, data);
  }

  async get(query: StoreQuery[]): Promise<StoreContents> {
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

  async set(configs: StoreContents): Promise<void> {
    const storedConfigs = await this.read();

    const nextConfigs = _([...configs, ...storedConfigs])
      .uniqBy((config) => `${config.set}.${config.schema}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();

    await this.write(nextConfigs);
  }
}
