// xml-config-store.ts
import { ConfigStore } from '../types';
import * as xml2js from 'xml2js';
import * as fs from 'fs';

interface XMLConfigStoreOptions {
  path: string;
  encoding?: BufferEncoding;
  xmlOptions?: xml2js.OptionsV2;
}

export default class XMLConfigStore implements ConfigStore {
  private path: string;
  private encoding: BufferEncoding;
  private xmlOptions: xml2js.OptionsV2;

  constructor(options: XMLConfigStoreOptions) {
    this.path = options.path;
    this.encoding = options.encoding || 'utf8';
    this.xmlOptions = options.xmlOptions || {};
  }

  async read(): Promise<any> {
    const xml = await fs.promises.readFile(this.path, this.encoding);
    const result = await xml2js.parseStringPromise(xml, this.xmlOptions);
    return result;
  }

  async write(data: any): Promise<void> {
    const builder = new xml2js.Builder(this.xmlOptions);
    const xml = builder.buildObject(data);
    await fs.promises.writeFile(this.path, xml, this.encoding);
  }
}
