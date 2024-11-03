type {{name:pascal}}ConfigStoreConfiguration = {}

export class {{name:pascal}}ConfigStore {
  constructor(configuration: {{name:pascal}}ConfigStoreConfiguration) {
  }

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    throw new Error('Method not implemented.');
  }

  async set(configs: Config[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
