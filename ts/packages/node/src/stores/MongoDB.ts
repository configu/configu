import { StoreQuery, StoreContents, StoreContentsWithId } from '@configu/ts';
import _ from 'lodash';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { TypeOrmStore, Config } from './TypeORM';

export class MongoStore extends TypeOrmStore {
  static readonly scheme = 'mongodb';
  constructor({
    port = 27017,
    authSource = 'admin',
    useUnifiedTopology = true,
    ...rest
  }: Omit<MongoConnectionOptions, 'type'>) {
    super(MongoStore.scheme, {
      type: 'mongodb',
      authSource,
      port,
      useUnifiedTopology,
      ...rest,
    });
  }

  shouldUnset(value: unknown): boolean {
    return value === undefined;
  }

  async getByQuery(query: StoreQuery): Promise<StoreContents> {
    const configRepository = this.dataSource.getMongoRepository(Config);

    const adjustedQuery = query.map((entry) => ({
      ...(entry.set !== '*' && { set: entry.set }),
      ...(entry.schema !== '*' && { schema: entry.schema }),
      ...(entry.key !== '*' && { key: entry.key }),
    }));

    return configRepository.findBy({ $or: adjustedQuery });
  }

  private prepareUpsert(entity: Partial<Config>) {
    const $set = _.pickBy(entity, (v) => !this.shouldUnset(v)) as Record<Partial<keyof Config>, unknown>;
    const $unset = _.chain(entity)
      .pickBy((v) => this.shouldUnset(v))
      .mapValues(() => '')
      .value() as Record<Partial<keyof Config>, ''>;

    if (_.isEmpty($unset)) {
      return { $set };
    }
    return { $set, $unset };
  }

  async upsert(configs: StoreContentsWithId): Promise<void> {
    const configRepository = this.dataSource.getMongoRepository(Config);

    const bulkOperations = configs.map((config) => ({
      updateOne: {
        filter: { _id: config._id },
        update: this.prepareUpsert(config),
        upsert: true,
      },
    }));

    await configRepository.bulkWrite(bulkOperations);
  }

  async delete(configIds: string[]): Promise<void> {
    const configRepository = this.dataSource.getMongoRepository(Config);

    const bulkOperations = configIds.map((configId) => ({
      deleteOne: {
        filter: { _id: configId },
      },
    }));

    await configRepository.bulkWrite(bulkOperations);
  }
}
