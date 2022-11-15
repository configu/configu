import 'reflect-metadata';
import { StoreQuery, StoreContents, Store } from '@configu/ts';
import { Entity, Column, DataSource, DataSourceOptions, Index, PrimaryGeneratedColumn } from 'typeorm';
import _ from 'lodash';

@Entity()
@Index(['schema', 'set'])
@Index(['schema', 'set', 'key'], { unique: true })
class Config {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('schema')
  @Column({ type: 'varchar', length: 100 })
  schema: string;

  @Index('set')
  @Column({ type: 'varchar', length: 100 })
  set: string;

  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column('varchar')
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

  private async delete(configs: StoreContents): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);
    const preloadedConfigs = await Promise.all(configs.map((config) => configRepository.preload(config)));
    await configRepository.delete(_.map(preloadedConfigs, 'id'));
  }

  private async upsert(configs: StoreContents): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);

    if (configs.length > 0) {
      await configRepository.upsert(configs, ['schema', 'set', 'key']);
    }
  }

  async set(configs: StoreContents): Promise<void> {
    const [configsToUpsert, configsToDelete] = _.partition(configs, 'value');

    if (configsToDelete.length > 0) {
      await this.delete(configsToDelete);
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

    console.log(await configRepository.find({ where: adjustedQuery }));

    return configRepository.find({ where: adjustedQuery });
  }
}
