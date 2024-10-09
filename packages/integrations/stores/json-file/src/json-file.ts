import { FileConfigStore } from '@configu/integrations/src/utils/File';
import { Config, Json } from '@configu/sdk';

export type JsonFileConfigStoreConfiguration = { path: string };

export class JsonFileConfigStore extends FileConfigStore {
  constructor({ path }: JsonFileConfigStoreConfiguration) {
    super({ path, initialFileState: Json.stringify({ data: [], beautify: true }) });
  }

  parse(fileContent: string) {
    return Json.parse(fileContent) as Config[];
  }

  stringify(nextConfigs: Config[]) {
    return Json.stringify({ data: nextConfigs, beautify: true });
  }
}
