import * as fs from 'fs';
import { promisify } from 'util';
import { KeyValueConfigStore } from '@configu/ts';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export class TOMLConfigStore extends KeyValueConfigStore {
  filePath: string;

  constructor(filePath: string) {
    super('toml');
    this.filePath = filePath;
  }

  protected async getByKey(key: string): Promise<string> {
    try {
      const tomlData = await readFile(this.filePath, 'utf8');
      const parsedData = JSON.parse(tomlData);
      return parsedData[key] ?? '';
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist yet, return an empty string
        return '';
      }
      throw error;
    }
  }

  protected async upsert(key: string, value: string): Promise<void> {
    try {
      const tomlData = await readFile(this.filePath, 'utf8');
      const parsedData = JSON.parse(tomlData);
      parsedData[key] = value;
      const tomlString = JSON.stringify(parsedData, null, 2);
      await writeFile(this.filePath, tomlString, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist yet, create a new one
        const newData = { [key]: value };
        const tomlString = JSON.stringify(newData, null, 2);
        await writeFile(this.filePath, tomlString, 'utf8');
      } else {
        throw error;
      }
    }
  }

  protected async delete(key: string): Promise<void> {
    try {
      const tomlData = await readFile(this.filePath, 'utf8');
      const parsedData = JSON.parse(tomlData);
      delete parsedData[key];
      const tomlString = JSON.stringify(parsedData, null, 2);
      await writeFile(this.filePath, tomlString, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist, nothing to delete
      } else {
        throw error;
      }
    }
  }
}
