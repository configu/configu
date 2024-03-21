import { promises as fs } from 'fs';
import path from 'path';
import { CsvFileConfigStore } from './CsvFile';

describe('CsvFileConfigStore', () => {
  const testCsvFilePath = path.join(__dirname, 'test.csv');

  beforeEach(async () => {
    await fs.writeFile(
      testCsvFilePath,
      `set,key,value
,rootkey,rootvalue
dev,GREETING,hey
prod,SUBJECT,world`,
    );
  });

  afterEach(async () => {
    await fs.unlink(testCsvFilePath);
  });

  test('should read configurations from CSV file', async () => {
    const store = new CsvFileConfigStore({ path: testCsvFilePath });
    const configs = await store.get([
      { set: 'dev', key: 'GREETING' },
      { set: 'prod', key: 'SUBJECT' },
    ]);

    expect(configs).toEqual([
      { set: 'dev', key: 'GREETING', value: 'hey' },
      { set: 'prod', key: 'SUBJECT', value: 'world' },
    ]);
  });

  const writeConfigs = async (store: CsvFileConfigStore) => {
    const configsToWrite = [
      { set: 'dev', key: 'GREETING', value: 'hey' },
      { set: 'prod', key: 'SUBJECT', value: 'world' },
    ];
    await store.set(configsToWrite);

    // * Read the file again to verify the write operation
    const newConfigs = await store.get([
      { set: 'dev', key: 'GREETING' },
      { set: 'prod', key: 'SUBJECT' },
    ]);
    expect(newConfigs).toEqual(configsToWrite);
  };

  test('should write configurations to new CSV file', async () => {
    await fs.unlink(testCsvFilePath);
    const store = new CsvFileConfigStore({ path: testCsvFilePath });
    await store.init();
    await writeConfigs(store);
  });

  test('should write configurations to an existing CSV file', async () => {
    const store = new CsvFileConfigStore({ path: testCsvFilePath });
    await writeConfigs(store);
  });

  test('should query new CSV file dev configurations', async () => {
    await fs.unlink(testCsvFilePath);
    const store = new CsvFileConfigStore({ path: testCsvFilePath });
    await store.init();
    const queries = [{ set: 'dev', key: 'GREETING' }];
    const results = await store.get(queries);
    expect(results).toEqual([]);
  });

  test('should query global configurations', async () => {
    const store = new CsvFileConfigStore({ path: testCsvFilePath });
    const queries = [{ set: '', key: 'rootkey' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: '', key: 'rootkey', value: 'rootvalue' }]);
  });

  test('should query configurations', async () => {
    const store = new CsvFileConfigStore({ path: testCsvFilePath });
    const queries = [{ set: 'prod', key: 'SUBJECT' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: 'prod', key: 'SUBJECT', value: 'world' }]);
  });
});
