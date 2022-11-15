import 'reflect-metadata';
import { StoreQuery, StoreContents, DatabaseStore, StoreContentsWithId } from '@configu/ts';
import { Entity, PrimaryColumn, ObjectIdColumn, Column, DataSource, DataSourceOptions, Index } from 'typeorm';
import _ from 'lodash';

// TODO: perhaps it should be ConfigEntity to avoid confusion?
@Entity()
export class Config {
  /**
   * TODO: decide the following:
   * - _id vs id
   * - what should be within the config table
   * - what should be a column
   * - Indexing?
   * - PrimaryColumn('text') vs ObjectIdColumn()
   * - _id vs id as the key for the PK
   */

  // @ObjectIdColumn()
  // _id: ObjectID;

  @PrimaryColumn('text')
  _id: string;

  @Column('text')
  schema: string;

  @Index('set')
  @Column('text')
  set: string;

  @Column('text')
  key: string;

  @Column('text')
  value: string;

  // TODO: decide if relevant here
  // @Column('timestamp')
  // createdAt: string;

  // TODO: decide if relevant here
  // @Column('timestamp')
  // updatedAt: string;
}

export abstract class TypeOrmStore extends DatabaseStore {
  readonly dataSource: DataSource;

  constructor(public protocol: string, dataSourceOptions: DataSourceOptions) {
    super(protocol);

    this.dataSource = new DataSource({
      ...dataSourceOptions,
      entities: [Config],
    });
  }

  async init() {
    await this.dataSource.initialize();
    super.init(this.dataSource.driver.database);
  }

  async getByQuery(query: StoreQuery): Promise<StoreContents> {
    const configRepository = this.dataSource.getRepository(Config);

    const adjustedQuery = query.map((entry) => ({
      ...(entry.set !== '*' && { set: entry.set }),
      ...(entry.schema !== '*' && { schema: entry.schema }),
      ...(entry.key !== '*' && { key: entry.key }),
    }));

    return configRepository.find({ where: adjustedQuery });
  }

  async delete(configIds: string[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);

    if (configIds.length > 0) {
      await configRepository.delete(configIds);
    }
  }
}

export abstract class TypeOrmStoreWithUpsert extends TypeOrmStore {
  // * Upsert is supported by AuroraDataApi, Cockroach, Mysql, Postgres, and Sqlite database drivers.
  async upsert(configs: StoreContentsWithId): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);

    if (configs.length > 0) {
      await configRepository.upsert(configs, ['_id']);
    }
  }
}
