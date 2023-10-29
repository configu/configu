import { promises as fs } from 'fs';
import path from 'path';
import { IniFileConfigStore } from './IniFile';

describe('IniFileConfigStore', () => {
  const testIniFilePath = path.join(__dirname, 'test.ini');

  beforeEach(async () => {
    await fs.writeFile(
      testIniFilePath,
      `
rootkey=rootvalue

[section]
key=value
        `,
    );
  });

  afterEach(async () => {
    await fs.unlink(testIniFilePath);
  });

  test('should write configurations to INI file', async () => {
    const store = new IniFileConfigStore({ path: testIniFilePath });
    const configsToWrite = [
      { set: '', key: 'global_key', value: 'global_value' },
      { set: 'section', key: 'section_key', value: 'section_value' },
    ];
    await store.set(configsToWrite);

    // * Read the file again to verify the write operation
    const writtenConfigs = await store.get([
      { set: '', key: 'global_key' },
      { set: 'section', key: 'section_key' },
    ]);
    expect(writtenConfigs).toEqual(configsToWrite);
  });

  test('should query global configurations', async () => {
    const store = new IniFileConfigStore({ path: testIniFilePath });
    const queries = [{ set: '', key: 'rootkey' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: '', key: 'rootkey', value: 'rootvalue' }]);
  });

  test('should query configurations', async () => {
    const store = new IniFileConfigStore({ path: testIniFilePath });
    const queries = [{ set: 'section', key: 'key' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: 'section', key: 'key', value: 'value' }]);
  });
});
