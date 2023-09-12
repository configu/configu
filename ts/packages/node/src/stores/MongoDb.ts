import { DataSource, DataSourceOptions, EntityManager } from 'typeorm';

export class MongoDBConfigStore {
  private dataSource: DataSource;

  constructor(configuration: DataSourceOptions) {
    // Initialize the DataSource with the provided configuration
    this.dataSource = new DataSource(configuration);
  }

  async getConnection(): Promise<EntityManager> {
    try {
      // Ensure the DataSource is initialized
      await this.dataSource.initialize();

      // Return the EntityManager for database operations
      return this.dataSource.manager;
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }
}