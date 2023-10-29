import { DataSource, DataSourceOptions, EntityManager, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ConfigStoreQuery, Config as IConfig } from '@configu/ts';
import { ORMConfigStore } from './ORM';

export class MongoDBConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  value: string;

  set: string;
}

export class MongoDBConfigStore extends ORMConfigStore {
  readonly dataSource: DataSource;

  constructor(configuration: DataSourceOptions) {
    super('mongodb', { ...configuration });
    this.dataSource = new DataSource(configuration);
  }

  async get(keys: ConfigStoreQuery[]): Promise<IConfig[]> {
    try {
      // Ensure the DataSource is initialized
      await this.dataSource.initialize();

      // Get the repository for the MongoDBConfigEntity
      const entityManager: EntityManager = this.dataSource.manager;
      const configRepository = entityManager.getRepository(MongoDBConfigEntity);

      const results: IConfig[] = [];

      await Promise.all(
        keys.map(async (key) => {
          // Use the query builder to find the configuration entry by key
          const configEntry = await configRepository
            .createQueryBuilder('config')
            .where('config.key = :key', { key })
            .getOne();

          if (configEntry) {
            // If a configuration entry with the key is found, add it to the results array
            results.push({ key: configEntry.key, set: configEntry.set, value: configEntry.value });
          }
        }),
      );

      return results;
    } catch (error) {
      throw new Error(`Failed to get configurations from MongoDB: ${error}`);
    }
  }

  async set(configs: IConfig[]): Promise<void> {
    try {
      // Ensure the DataSource is initialized
      await this.dataSource.initialize();

      // Get the repository for the MongoDBConfigEntity
      const entityManager: EntityManager = this.dataSource.manager;
      const configRepository = entityManager.getRepository(MongoDBConfigEntity);

      await Promise.all(
        configs.map(async (config) => {
          const { key, value } = config;

          // Check if a configuration entry with the provided key exists
          const existingConfig = await configRepository.findOne({
            where: { key },
          });

          if (existingConfig) {
            // If an entry with the key exists, update its value
            if (value) {
              existingConfig.value = value;
            }
            await configRepository.save(existingConfig);
          } else {
            // If no entry with the key exists, create a new one
            const newConfigEntry = configRepository.create({
              key,
              value,
            });
            await configRepository.save(newConfigEntry);
          }
        }),
      );
    } catch (error) {
      throw new Error(`Failed to set configurations in MongoDB: ${error}`);
    }
  }
}
