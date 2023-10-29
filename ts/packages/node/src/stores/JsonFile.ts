import { type Config, Convert } from '@configu/ts';
import { FileConfigStore } from './File';

export type JsonFileConfigStoreConfiguration = { path: string };

export class JsonFileConfigStore extends FileConfigStore {
  constructor({ path }: JsonFileConfigStoreConfiguration) {
    const initialFileState = Convert.configStoreContentsToJson([]);
    super('json-file', path, initialFileState);
  }

  parseFileContent(fileContent: string) {
    return Convert.toConfigStoreContents(fileContent);
  }

  stringifyConfigs(nextConfigs: Config[]) {
    return Convert.configStoreContentsToJson(nextConfigs);
  }
}
