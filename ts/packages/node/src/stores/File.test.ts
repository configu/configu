import { promises as fs } from 'fs';
import path from 'path';
import { Convert, type Config } from '@configu/ts';
import { FileConfigStore } from './File';

class MockFileConfigStore extends FileConfigStore {
  constructor(filePath: string) {
    const initialFileState = Convert.configStoreContentsToJson([]);
    super('mock-file', { path: filePath, initialFileState });
  }

  parse(fileContent: string): Config[] {
    return Convert.toConfigStoreContents(fileContent);
  }

  stringify(nextConfigs: Config[]): string {
    return Convert.configStoreContentsToJson(nextConfigs);
  }
}

describe('FileConfigStore', () => {
  const testFilePath = path.join(__dirname, 'test.txt');

  beforeAll(async () => {
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  });

  afterAll(async () => {
    await fs.unlink(testFilePath);
  });

  test('should create file', async () => {
    const store = new MockFileConfigStore(testFilePath);
    await store.init();
    const fileExists = await fs
      .access(testFilePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  test('should set and get configs', async () => {
    const store = new MockFileConfigStore(testFilePath);
    await store.init();
    const configsToWrite = [
      { set: '', key: 'global_key', value: 'global_value' },
      { set: 'section', key: 'section_key', value: 'section_value' },
    ];
    await store.set(configsToWrite);
    const newConfigs = await store.get(configsToWrite.map(({ set, key }) => ({ set, key })));
    expect(newConfigs).toEqual(configsToWrite);
  });

  test('should delete configs', async () => {
    const store = new MockFileConfigStore(testFilePath);
    await store.init();
    const configsToDelete = [
      { set: '', key: 'global_key', value: '' },
      { set: 'section', key: 'section_key', value: '' },
    ];
    await store.set(configsToDelete);
    const newConfigs = await store.get(configsToDelete.map(({ set, key }) => ({ set, key })));
    expect(newConfigs).toEqual([]);
  });
});
