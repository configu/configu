import { type Config } from '@configu/ts';
import { parse, stringify } from 'csv/sync';
import { FileConfigStore } from './File';

export type CsvFileConfigStoreConfiguration = { path: string };

export class CsvFileConfigStore extends FileConfigStore {
  constructor({ path }: CsvFileConfigStoreConfiguration) {
    const initialFileState = '';
    super('csv-file', { path, initialFileState });
  }

  parse(fileContent: string): Config[] {
    return parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
  }

  stringify(nextConfigs: Config[]): string {
    return stringify(nextConfigs, { header: true });
  }
}
