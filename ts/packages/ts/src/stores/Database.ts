import _ from 'lodash';
import forge from 'node-forge';
import { Store } from '../Store';
import { StoreQuery, StoreContents, Config } from '../types';

export abstract class DatabaseStore extends Store {
  private isInitialized = false;
  constructor(scheme: string, userinfo?: string) {
    super(scheme, userinfo);
  }

  abstract getByQuery(query: StoreQuery): Promise<StoreContents>;

  abstract upsert(configs: StoreContents): Promise<void>;

  abstract delete(configIds: string[]): Promise<void>;

  abstract initialize(): Promise<void>;

  async init() {
    if (!this.isInitialized) {
      try {
        await this.initialize();
        this.isInitialized = true;
      } catch (err) {
        // TODO: decide what to do with the error
        throw new Error(`failed to initialize ${this.scheme} - ${err.message}`);
      }
    }
  }

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
    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} is not initialized`);
    }

    return this.getByQuery(query);
  }

  async set(configs: StoreContents): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} is not initialized`);
    }

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
