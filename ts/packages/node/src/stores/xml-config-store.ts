import { promises as fs } from 'fs';
import * as xml2js from 'xml2js';

class XMLConfigStore {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async readConfig(): Promise<any> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parser = new xml2js.Parser();
      const parsedData = await parser.parseStringPromise(data);
      return parsedData;
    } catch (error) {
      // Handle errors appropriately (e.g., file not found, invalid XML)
      throw error;
    }
  }

  async writeConfig(config: any): Promise<void> {
    try {
      const builder = new xml2js.Builder();
      const xml = builder.buildObject(config);
      await fs.writeFile(this.filePath, xml, 'utf-8');
    } catch (error) {
      // Handle errors appropriately (e.g., write permission denied)
      throw error;
    }
  }
}

export default XMLConfigStore;