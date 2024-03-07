import 'reflect-metadata';
import { ConfigStore, type ConfigStoreQuery, type Config as IConfig } from '@configu/ts';
import {
  Entity,
  Column,
  DataSource,
  type DataSourceOptions,
  Index,
  PrimaryGeneratedColumn,
  EntitySchema,
} from 'typeorm';
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
        name: `${tableName}_IDX_SET_KEY`,
        unique: true,
        columns: ['set', 'key'],
      },
    ],
  });

type ORMConfigStoreOptions = DataSourceOptions & {
  tables?: string[];
};

export abstract class ORMConfigStore extends ConfigStore {
  readonly dataSource: DataSource;
  private readonly tables: Record<string, EntitySchema>;
  private activeTable: EntitySchema;

  constructor(type: string, { tables = [], ...dataSourceOptions }: ORMConfigStoreOptions) {
    super(type);
    this.tables = _.reduce(
      [...tables, 'config'],
      (entities, tableName) => {
        return { ...entities, [tableName]: createTable(tableName) };
      },
      {},
    );
    this.activeTable = this.tables.config as EntitySchema;
    this.dataSource = new DataSource({
      // TODO: synchronize is not production safe - create a migration script to initialize tables
      synchronize: true,
      entities: Object.values(this.tables),
      ...dataSourceOptions,
    });
  }

  async init() {
    if (this.dataSource.isInitialized) {
      return;
    }
    await this.dataSource.initialize();
  }

  useTable(tableName: string) {
    this.activeTable = this.tables[tableName] ?? (this.tables.config as EntitySchema);
  }

  private async delete(configs: IConfig[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(this.activeTable);
    const preloadedConfigs = await Promise.all(configs.map((config) => configRepository.preload(config)));
    await configRepository.delete(_.map(preloadedConfigs, 'id'));
  }

  private async upsert(configs: IConfig[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(this.activeTable);

    if (configs.length > 0) {
      await configRepository.upsert(configs, ['set', 'key']);
    }
    // await this.dataSource.destroy();
  }

  async get(queries: ConfigStoreQuery[]): Promise<IConfig[]> {
    const configRepository = this.dataSource.getRepository(this.activeTable);

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
