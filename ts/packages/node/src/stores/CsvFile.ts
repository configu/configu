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
    const csvRows = parse(fileContent);
    const configs = csvRows.slice(1).map(([set, key, value]: [string, string, string]) => ({ set, key, value }));
    return configs;
  }

  stringify(nextConfigs: Config[]): string {
    const csvRows = [['set', 'key', 'value'], ...nextConfigs.map(({ set, key, value }) => [set, key, value])];
    return stringify(csvRows);
  }
}
