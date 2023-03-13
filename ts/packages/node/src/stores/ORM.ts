import 'reflect-metadata';
import { ConfigStore, ConfigStoreQuery, Config as IConfig } from '@configu/ts';
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

export abstract class ORMStore extends ConfigStore {
  readonly dataSource: DataSource;

  constructor(type: string, dataSourceOptions: DataSourceOptions) {
    super(type);

    this.dataSource = new DataSource({
      // TODO: synchronize is not production safe - create a migration script to initialize tables
      synchronize: true,
      entities: [Config],
      ...dataSourceOptions,
    });
  }

  async init() {
    await this.dataSource.initialize();
  }

  private async delete(configs: IConfig[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);
    const preloadedConfigs = await Promise.all(configs.map((config) => configRepository.preload(config)));
    await configRepository.delete(_.map(preloadedConfigs, 'id'));
  }

  private async upsert(configs: IConfig[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(Config);

    if (configs.length > 0) {
      await configRepository.upsert(configs, ['schema', 'set', 'key']);
    }
  }

  async get(queries: ConfigStoreQuery[]): Promise<IConfig[]> {
    const configRepository = this.dataSource.getRepository(Config);

    const adjustedQuery = queries.map((entry) => ({
      ...(entry.set !== '*' && { set: entry.set }),
      ...(entry.key !== '*' && { key: entry.key }),
    }));

    return configRepository.find({ where: adjustedQuery });
  }

  async set(configs: IConfig[]): Promise<void> {
    const [configsToUpsert, configsToDelete] = _.partition(configs, 'value');

    if (configsToDelete.length > 0) {
      await this.delete(configsToDelete);
    }

    if (configsToUpsert.length > 0) {
      await this.upsert(configsToUpsert);
    }
  }
}
