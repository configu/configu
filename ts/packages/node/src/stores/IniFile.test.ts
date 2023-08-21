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

  test('should read configurations from INI file', async () => {
    const store = new IniFileConfigStore({ path: testIniFilePath });
    const configs = await store.read();
    expect(configs).toEqual([
      { set: '', key: 'rootkey', value: 'rootvalue' },
      { set: 'section', key: 'key', value: 'value' },
    ]);
  });

  test('should write configurations to INI file', async () => {
    const store = new IniFileConfigStore({ path: testIniFilePath });
    const newConfigs = [
      { set: '', key: 'global_key', value: 'global_value' },
      { set: 'section', key: 'section_key', value: 'section_value' },
    ];
    await store.write(newConfigs);

    // Read the file again to verify the write operation
    const writtenData = await fs.readFile(testIniFilePath, 'utf8');
    expect(writtenData.trim()).toContain('global_key=global_value\n\n[section]\nsection_key=section_value');
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
