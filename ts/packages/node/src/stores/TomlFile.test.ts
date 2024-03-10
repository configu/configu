import { promises as fs } from 'fs';
import path from 'path';
import { TomlFileConfigStore } from './TomlFile';

describe('TomlFileConfigStore', () => {
  const testTomlFilePath = path.join(__dirname, 'test.toml');

  beforeEach(async () => {
    await fs.writeFile(
      testTomlFilePath,
      `
rootkey = "rootvalue"
[dev]
GREETING = "hey"
[prod]
SUBJECT = "world"
`,
    );
  });

  afterEach(async () => {
    await fs.unlink(testTomlFilePath);
  });

  test('should read configurations from TOML file', async () => {
    const store = new TomlFileConfigStore({ path: testTomlFilePath });
    const configs = await store.get([
      { set: 'dev', key: 'GREETING' },
      { set: 'prod', key: 'SUBJECT' },
    ]);

    expect(configs).toEqual([
      { set: 'dev', key: 'GREETING', value: 'hey' },
      { set: 'prod', key: 'SUBJECT', value: 'world' },
    ]);
  });

  const writeConfigs = async (store: TomlFileConfigStore) => {
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

  test('should write configurations to new TOML file', async () => {
    await fs.unlink(testTomlFilePath);
    const store = new TomlFileConfigStore({ path: testTomlFilePath });
    await store.init();
    await writeConfigs(store);
  });

  test('should write configurations to an existing TOML file', async () => {
    const store = new TomlFileConfigStore({ path: testTomlFilePath });
    await writeConfigs(store);
  });

  test('should query new TOML file dev configurations', async () => {
    await fs.unlink(testTomlFilePath);
    const store = new TomlFileConfigStore({ path: testTomlFilePath });
    await store.init();
    const queries = [{ set: 'dev', key: 'GREETING' }];
    const results = await store.get(queries);
    expect(results).toEqual([]);
  });

  test('should query global configurations', async () => {
    const store = new TomlFileConfigStore({ path: testTomlFilePath });
    const queries = [{ set: '', key: 'rootkey' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: '', key: 'rootkey', value: 'rootvalue' }]);
  });

  test('should query configurations', async () => {
    const store = new TomlFileConfigStore({ path: testTomlFilePath });
    const queries = [{ set: 'prod', key: 'SUBJECT' }];
    const results = await store.get(queries);
    expect(results).toEqual([{ set: 'prod', key: 'SUBJECT', value: 'world' }]);
  });
});
