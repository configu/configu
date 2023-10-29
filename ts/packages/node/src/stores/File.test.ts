import { promises as fs } from 'fs';
import path from 'path';
import { IniFileConfigStore } from './IniFile';

describe('IniFileConfigStore', () => {
  const testFilePath = path.join(__dirname, 'test.txt');

  beforeAll(async () => {
    // * Ensure file does not exist and handle the case when it doesn't exist
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // * Handle the error if the file does not exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  });

  afterAll(async () => {
    // * Ensure file deleted after all tests
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
