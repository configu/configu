import { promises as fs } from 'fs';
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

  // * Creates the file with the required "empty state" in case it does not exist
  async init() {
    try {
      await fs.access(this.path); // * This will throw an error if the file doesn't exist
    } catch (error) {
      if (error.code === 'ENOENT') {
        // * File does not exist so we create it with the initial state
        await fs.writeFile(this.path, this.initialFileState);
      } else {
        throw error;
      }
    }
  }

  // * Parses the file content into configs
  protected abstract parseFileContent(fileContent: string): Config[];

  private async read(): Promise<Config[]> {
    const fileContent = await fs.readFile(this.path, 'utf8');
    const parsedFileContent = this.parseFileContent(fileContent);
    return parsedFileContent;
  }

  // * Stringifies the configs into the format the file store expects
  protected abstract stringifyConfigs(nextConfigs: Config[]): string;

  // * Writes the next state of the configs to the file
  private async write(nextConfigs: Config[]): Promise<void> {
    const nextFileContent = this.stringifyConfigs(nextConfigs);
    await fs.writeFile(this.path, nextFileContent);
  }

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
