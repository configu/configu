import { promises as fs } from 'fs';
import path from 'path';
import { IniFileConfigStore } from './IniFile';

describe('IniFileConfigStore', () => {
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
    const store = new IniFileConfigStore({ path: testFilePath });
    await store.init();
    const fileExists = await fs
      .access(testFilePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });
});
