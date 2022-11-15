import 'reflect-metadata';
import { StoreQuery, StoreContents, Store } from '@configu/ts';
import { Entity, Column, DataSource, DataSourceOptions, Index, PrimaryGeneratedColumn } from 'typeorm';
import _ from 'lodash';

@Entity()
@Index(['schema', 'set'])
class Config {
  /**
   * TODO: decide the following:
   * - Indexing?
   */
  @PrimaryGeneratedColumn()
  id: string;

  @Index('schema')
  @Column('text')
  schema: string;

  @Index('set')
  @Column('text')
  set: string;

  @Column('text')
  key: string;

  @Column('text')
  value: string;
}

export abstract class TypeOrmStore extends Store {
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

  private async delete(configIds: string[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);

    if (configIds.length > 0) {
      await configRepository.delete(configIds);
    }
  }

  private async upsert(configs: StoreContents): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);

    if (configs.length > 0) {
      await configRepository.upsert(configs, ['id']);
    }
  }

  async set(configs: StoreContents): Promise<void> {
    const [configsToUpsert, configsToDelete] = _.partition(configs, 'value');

    if (configsToDelete.length > 0) {
      await this.delete(_.map(configsToDelete, 'id'));
    }

    if (configsToUpsert.length > 0) {
      await this.upsert(configsToUpsert);
    }
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    const configRepository = this.dataSource.getRepository(Config);

    const adjustedQuery = query.map((entry) => ({
      ...(entry.set !== '*' && { set: entry.set }),
      ...(entry.schema !== '*' && { schema: entry.schema }),
      ...(entry.key !== '*' && { key: entry.key }),
    }));

    return configRepository.find({ where: adjustedQuery });
  }
}
