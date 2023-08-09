import { promises as fs } from 'fs';
import path from 'path';
import { IniFileConfigStore } from './IniFile';

describe('IniFileConfigStore', () => {
  const testIniFilePath = path.join(__dirname, 'test.ini');

  beforeEach(async () => {
    await fs.writeFile(
      testIniFilePath,
      `
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
    expect(configs).toEqual([{ set: 'section', key: 'key', value: 'value' }]);
  });

  test('should write configurations to INI file', async () => {
    const store = new IniFileConfigStore({ path: testIniFilePath });
    const newConfigs = [{ set: 'default', section: 'section2', key: 'key2', value: 'value2' }];
    await store.write(newConfigs);

    // Read the file again to verify the write operation
    const writtenData = await fs.readFile(testIniFilePath, 'utf8');
    expect(writtenData.trim()).toContain('key2=value2');
  });

  test('should query configurations', async () => {
    const store = new IniFileConfigStore({ path: testIniFilePath });
    const queries = [{ set: 'section', key: 'key' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: 'section', key: 'key', value: 'value' }]);
  });
});
