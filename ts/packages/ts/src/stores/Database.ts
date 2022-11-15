import _ from 'lodash';
import forge from 'node-forge';
import { Store } from '../Store';
import { StoreQuery, StoreContents, Config } from '../types';

interface ConfigWithId extends Config {
  _id: string;
}

export type StoreContentsWithId = ConfigWithId[];

export abstract class DatabaseStore extends Store {
  constructor(scheme: string) {
    super(scheme);
  }

  protected abstract getByQuery(query: StoreQuery): Promise<StoreContents>;

  protected abstract upsert(configs: StoreContentsWithId): Promise<void>;

  protected abstract delete(configIds: string[]): Promise<void>;

  // TODO: TBD
  private hashObject = (object: Record<string, unknown>): string => {
    const objectAsString = JSON.stringify(object);
    const md = forge.md.md5.create();
    md.update(objectAsString);
    const md5HexString = md.digest().toHex();
    return md5HexString;
  };

  // TODO: TBD
  calcId(entity: Pick<Config, 'set' | 'schema' | 'key'>) {
    return this.hashObject(_.pick(entity, ['set', 'schema', 'key']));
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    return this.getByQuery(query);
  }

  async set(configs: StoreContents): Promise<void> {
    // TODO: Leave this for each db store to implement in case they have bulk ops?

    const configEntities = configs.map((config) => ({
      ...config,
      _id: this.calcId(_.pick(config, ['set', 'schema', 'key'])),
    }));
    const [configsToUpsert, configsToDelete] = _.partition(configEntities, 'value');

    if (configsToDelete.length > 0) {
      await this.delete(_.map(configsToDelete, '_id'));
    }

    if (configsToUpsert.length > 0) {
      await this.upsert(configsToUpsert);
    }
  }
}
