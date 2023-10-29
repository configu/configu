import { type Config, Convert } from '@configu/ts';
import { FileConfigStore } from './File';

export type JsonFileConfigStoreConfiguration = { path: string };

export class JsonFileConfigStore extends FileConfigStore {
  constructor({ path }: JsonFileConfigStoreConfiguration) {
    const initialFileState = Convert.configStoreContentsToJson([]);
    super('json-file', path, initialFileState);
  }

  async read() {
    const fileContent = await this.readFileContent();
    return Convert.toConfigStoreContents(fileContent);
  }

  async write(nextConfigs: Config[]) {
    const nextFileContent = Convert.configStoreContentsToJson(nextConfigs);
    await this.writeFileContent(nextFileContent);
  }
}
