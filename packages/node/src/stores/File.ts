import { promises as fs } from 'fs';
import { type Config, ConfigStore, type ConfigStoreQuery } from '@configu/ts';
import _ from 'lodash';

export type FileConfigStoreConfiguration = { path: string; initialFileState: string };

export abstract class FileConfigStore extends ConfigStore {
  readonly path: string;
  readonly initialFileState: string;
  constructor(type: string, { path, initialFileState }: FileConfigStoreConfiguration) {
    super(type);
    this.path = path;
    this.initialFileState = initialFileState;
  }

  async init() {
    try {
      await fs.access(this.path);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(this.path, this.initialFileState);
      } else {
        throw error;
      }
    }
  }

  protected abstract parse(fileContent: string): Config[];

  private async read(): Promise<string> {
    return fs.readFile(this.path, 'utf8');
  }

  protected abstract stringify(nextConfigs: Config[]): string;

  private async write(fileContents: string): Promise<void> {
    await fs.writeFile(this.path, fileContents);
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const fileContents = await this.read();
    const storedConfigs = this.parse(fileContents);

    return storedConfigs.filter((config) => {
      return queries.some(({ set, key }) => {
        return set === config.set && key === config.key;
      });
    });
  }

  async set(configs: Config[]): Promise<void> {
    const fileContents = await this.read();
    const storedConfigs = this.parse(fileContents);

    const nextConfigs = _([...configs, ...storedConfigs])
      .uniqBy((config) => `${config.set}.${config.key}`)
      .filter((config) => Boolean(config.value))
      .value();
    const nextFileContents = this.stringify(nextConfigs);

    await this.write(nextFileContents);
  }
}
