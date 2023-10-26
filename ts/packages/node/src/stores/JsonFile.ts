import { promises as fs, existsSync } from 'fs';
import { type Config, Convert } from '@configu/ts';
import { FileConfigStore } from './FileConfigStore';

export type JsonFileConfigStoreConfiguration = { path: string };

export class JsonFileConfigStore extends FileConfigStore {
  constructor({ path }: JsonFileConfigStoreConfiguration) {
    super('json-file', path);
  }

  async init() {
    const fileExists = await existsSync(this.path);
    if (!fileExists) {
      const initialFileState = Convert.configStoreContentsToJson([]);
      await fs.writeFile(this.path, initialFileState);
    }
  }

  async read() {
    const data = await fs.readFile(this.path, 'utf8');
    return Convert.toConfigStoreContents(data);
  }

  async write(nextConfigs: Config[]) {
    const data = Convert.configStoreContentsToJson(nextConfigs);
    await fs.writeFile(this.path, data);
  }
}
