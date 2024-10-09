import { type Config } from '@configu/sdk';
import { parse, stringify } from 'csv/sync';
import { FileConfigStore } from '@configu/integrations/src/utils/File';

export type CsvFileConfigStoreConfiguration = { path: string };

export class CsvFileConfigStore extends FileConfigStore {
  constructor({ path }: CsvFileConfigStoreConfiguration) {
    const initialFileState = '';
    super({ path, initialFileState });
  }

  parse(fileContent: string): Config[] {
    return parse(fileContent, { columns: true, skip_empty_lines: true });
  }

  stringify(nextConfigs: Config[]): string {
    return stringify(nextConfigs, { header: true });
  }
}
