import 'reflect-metadata';
import { ConfigStore, type ConfigStoreQuery, type Config as IConfig } from '@configu/ts';
import { Entity, Column, DataSource, type DataSourceOptions, Index, PrimaryGeneratedColumn } from 'typeorm';
import _ from 'lodash';

@Entity()
@Index(['set', 'key'], { unique: true })
class Config {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('set')
  @Column('text')
  set: string;

  @Column('text')
  key: string;

  @Column('text')
  value: string;
}

export abstract class ORMConfigStore extends ConfigStore {
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
      await configRepository.upsert(configs, ['set', 'key']);
    }
  }

  async get(queries: ConfigStoreQuery[]): Promise<IConfig[]> {
    const configRepository = this.dataSource.getRepository(Config);

    const adjustedQuery = queries.map((entry) => ({
      set: entry.set,
      key: entry.key,
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
