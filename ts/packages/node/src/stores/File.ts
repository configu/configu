import { promises as fs, existsSync } from 'fs';
import { type Config, ConfigStore, type ConfigStoreQuery } from '@configu/ts';
import _ from 'lodash';

export abstract class FileConfigStore extends ConfigStore {
  readonly path: string;
  readonly initialFileState: string;
  constructor(type: string, path: string, initialFileState: string) {
    super(type);
    this.path = path;
    this.initialFileState = initialFileState;
  }

  protected async readFileContent(): Promise<string> {
    return fs.readFile(this.path, 'utf8');
  }

  protected async writeFileContent(content: string): Promise<void> {
    await fs.writeFile(this.path, content);
  }

  // * Creates the file with the required "empty state" in case it does not exist
  async init() {
    const fileExists = await existsSync(this.path);
    if (!fileExists) {
      await this.writeFileContent(this.initialFileState);
    }
  }

  // * Reads all the configs from the file
  protected abstract read(): Promise<Config[]>;

  // * Writes the next state of the configs to the file
  protected abstract write(nextConfigs: Config[]): Promise<void>;

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const storedConfigs = await this.read();

    return storedConfigs.filter((config) => {
      return queries.some(({ set, key }) => {
        return set === config.set && key === config.key;
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    const storedConfigs = await this.read();

    const nextConfigs = _([...configs, ...storedConfigs])
      .uniqBy((config) => `${config.set}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();

    await this.write(nextConfigs);
  }
}
