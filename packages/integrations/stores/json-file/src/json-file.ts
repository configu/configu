import { FileConfigStore } from '@configu/integrations/src/utils/File';
import { Config } from '@configu/sdk';

export type JsonFileConfigStoreConfiguration = { path: string };

export class JsonFileConfigStore extends FileConfigStore {
  constructor({ path }: JsonFileConfigStoreConfiguration) {
    super({ path, initialFileState: JSON.stringify([], null, 2) });
  }

  parse(fileContent: string) {
    return JSON.parse(fileContent) as Config[];
  }

  stringify(nextConfigs: Config[]) {
    return JSON.stringify(nextConfigs, null, 2);
  }
}
