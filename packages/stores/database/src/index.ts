import 'reflect-metadata';
import { DataSource, EntitySchema, type DataSourceOptions } from 'typeorm';
import crypto from 'node:crypto';
import { _, ConfigStore, type ConfigQuery, type Config } from '@configu/sdk';

// const createEntity = (tableName: string) => {
//   @Entity({ name: tableName })
//   @Index(['set', 'key'], { unique: true })
//   class Config {
//     @PrimaryGeneratedColumn('uuid')
//     id: string;

//     @Index()
//     @Column('text')
//     set: string;

//     @Column('text')
//     key: string;

//     @Column('text')
//     value: string;
//   }

//   return Config;
// };

export type ORMConfigStoreSharedConfiguration = {
  tableName?: string;
};

type ORMConfigStoreConfiguration = DataSourceOptions & ORMConfigStoreSharedConfiguration;

export abstract class ORMConfigStore extends ConfigStore {
  readonly dataSource: DataSource;
  // private readonly configEntity: ReturnType<typeof createEntity>;
  private readonly configEntity: EntitySchema;

  protected constructor({ tableName = 'config', ...dataSourceOptions }: ORMConfigStoreConfiguration) {
    super();
    // this.configEntity = createEntity(tableName);
    this.configEntity = new EntitySchema({
      name: 'Config',
      tableName,
      columns: {
        id: {
          type: 'varchar',
          length: 32, // MD5 produces a 32-character hexadecimal string
          primary: true,
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
          name: 'set_key',
          unique: true,
          columns: ['set', 'key'],
        },
        {
          name: 'set',
          columns: ['set'],
        },
      ],
    });

    this.dataSource = new DataSource({
      // TODO: synchronize is not production safe - create a migration script to initialize tables
      synchronize: true,
      entities: [this.configEntity],
      ...dataSourceOptions,
    });
  }

  override async init() {
    if (this.dataSource.isInitialized) {
      return;
    }
    await this.dataSource.initialize();
  }

  static id({ set, key }: Config): string {
    // MD5 produces a 32-character hexadecimal string
    return crypto.hash('md5', set + key, 'hex');
  }

  private async delete(configs: Config[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(this.configEntity);
    const configsToDelete = configs.map((config) => ORMConfigStore.id(config));
    await configRepository.delete(configsToDelete);
  }

  private async upsert(configs: Config[]): Promise<void> {
    const configRepository = this.dataSource.getRepository(this.configEntity);
    const configsToUpsert = configs.map((config) => ({
      id: ORMConfigStore.id(config),
      ...config,
    }));
    if (configs.length > 0) {
      await configRepository.upsert(configsToUpsert, ['set', 'key']);
    }
  }

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    const configRepository = this.dataSource.getRepository(this.configEntity);

    const adjustedQuery = queries.map((entry) => ({
      set: entry.set,
      key: entry.key,
    }));

    return configRepository.find({ where: adjustedQuery });
  }

  async set(configs: Config[]): Promise<void> {
    const [configsToUpsert, configsToDelete] = _.partition(configs, 'value');

    if (configsToDelete.length > 0) {
      await this.delete(configsToDelete);
    }

    if (configsToUpsert.length > 0) {
      await this.upsert(configsToUpsert);
    }
  }
}
