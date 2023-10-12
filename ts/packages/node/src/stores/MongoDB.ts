import { DataSource, DataSourceOptions, EntityManager, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseMongoConfigStore } from './MongoOrm';

export class MongoDBConfigEntity {
  // Define the MongoDBConfigEntity entity for storing configuration data in MongoDB
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  value: string;
}

export class MongoDBConfigStore extends BaseMongoConfigStore {
  private dataSource: DataSource;

  constructor(configuration: DataSourceOptions) {
    super();
    this.dataSource = new DataSource(configuration);
  }

  async get(key: string): Promise<string | undefined> {
    try {
      // Ensure the DataSource is initialized
      await this.dataSource.initialize();

      // Get the repository for the MongoDBConfigEntity
      const entityManager: EntityManager = this.dataSource.manager;
      const configRepository = entityManager.getRepository(MongoDBConfigEntity);

      // Use the query builder to find the configuration entry by key
      const configEntry = await configRepository
        .createQueryBuilder('config')
        .where('config.key = :key', { key })
        .getOne();

      // Extract and return the value if found, or undefined if not found
      return configEntry?.value;
    } catch (error) {
      throw new Error(`Failed to get configuration from MongoDB: ${error}`);
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      // Ensure the DataSource is initialized
      await this.dataSource.initialize();

      // Get the repository for the MongoDBConfigEntity
      const entityManager: EntityManager = this.dataSource.manager;
      const configRepository = entityManager.getRepository(MongoDBConfigEntity);

      // Check if a configuration entry with the provided key exists
      const existingConfig = await configRepository.findOne({
        where: { key }, // Use the where method to specify the condition
      });

      if (existingConfig) {
        // If an entry with the key exists, update its value
        existingConfig.value = value;
        await configRepository.save(existingConfig);
      } else {
        // If no entry with the key exists, create a new one
        const newConfigEntry = configRepository.create({
          key,
          value,
        });
        await configRepository.save(newConfigEntry);
      }

      // Return success
    } catch (error) {
      throw new Error(`Failed to set configuration in MongoDB: ${error}`);
    }
  }
}
