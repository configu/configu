import 'reflect-metadata';
import { ConfigStore, type ConfigStoreQuery, type Config as IConfig } from '@configu/ts';
import { DataSource, type DataSourceOptions, EntitySchema } from 'typeorm';
import _ from 'lodash';

const createTable = (tableName: string) =>
  new EntitySchema<IConfig & { id: string }>({
    name: tableName,
    columns: {
      id: {
        type: 'uuid',
        primary: true,
        generated: 'uuid',
      },
      set: {
        type: 'text',
      },
      key: {
        type: 'text',
      },
      value: {
        type: 'text',
      },
    },
    indices: [
      {
        name: `${tableName.toUpperCase()}_IDX_SET_KEY`,
        unique: true,
        columns: ['set', 'key'],
      },
    ],
  });

type ORMConfigStoreOptions = DataSourceOptions & {
  tableName?: string;
};

export abstract class ORMConfigStore extends ConfigStore {
  readonly dataSource: DataSource;
  private readonly table: EntitySchema;

  protected constructor(type: string, { tableName = 'config', ...dataSourceOptions }: ORMConfigStoreOptions) {
    super(type);
    this.table = createTable(tableName);
    this.dataSource = new DataSource({
      // TODO: synchronize is not production safe - create a migration script to initialize tables
      synchronize: true,
      entities: [this.table],
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
    const configRepository = this.dataSource.getRepository(this.table);
    const preloadedConfigs = await Promise.all(configs.map((config) => configRepository.preload(config)));
    await configRepository.delete(_.map(preloadedConfigs, 'id'));
  }

  private async upsert(configs: IConfig[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(this.table);

    if (configs.length > 0) {
      await configRepository.upsert(configs, ['set', 'key']);
    }
    // await this.dataSource.destroy();
  }

  async get(queries: ConfigStoreQuery[]): Promise<IConfig[]> {
    const configRepository = this.dataSource.getRepository(this.table);

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
