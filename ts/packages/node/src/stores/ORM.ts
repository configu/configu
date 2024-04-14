import 'reflect-metadata';
import { ConfigStore, type ConfigStoreQuery, type Config as IConfig } from '@configu/ts';
import { DataSource, type DataSourceOptions, Entity, Index, PrimaryGeneratedColumn, Column } from 'typeorm';
import _ from 'lodash';

const createEntity = (tableName: string) => {
  @Entity({ name: tableName })
  @Index(['set', 'key'], { unique: true })
  class Config {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('text')
    set: string;

    @Column('text')
    key: string;

    @Column('text')
    value: string;
  }

  return Config;
};

export type ORMConfigStoreSharedConfiguration = {
  tableName?: string;
};

type ORMConfigStoreConfiguration = DataSourceOptions & ORMConfigStoreSharedConfiguration;

export abstract class ORMConfigStore extends ConfigStore {
  readonly dataSource: DataSource;
  private readonly configEntity: ReturnType<typeof createEntity>;

  protected constructor(type: string, { tableName = 'config', ...dataSourceOptions }: ORMConfigStoreConfiguration) {
    super(type);
    this.configEntity = createEntity(tableName);
    this.dataSource = new DataSource({
      // TODO: synchronize is not production safe - create a migration script to initialize tables
      synchronize: true,
      entities: [this.configEntity],
      ...dataSourceOptions,
    });
  }

  async init() {
    if (this.dataSource.isInitialized) {
      return;
    }
    await this.dataSource.initialize();
  }

  private async delete(configs: IConfig[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(this.configEntity);
    const preloadedConfigs = await Promise.all(configs.map((config) => configRepository.preload(config)));
    await configRepository.delete(_.map(preloadedConfigs, 'id'));
  }

  private async upsert(configs: IConfig[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(this.configEntity);

    if (configs.length > 0) {
      await configRepository.upsert(configs, ['set', 'key']);
    }
  }

  async get(queries: ConfigStoreQuery[]): Promise<IConfig[]> {
    const configRepository = this.dataSource.getRepository(this.configEntity);

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
