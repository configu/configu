import xml2js from 'xml2js';
import { type Config } from '@configu/ts';
import { FileConfigStore } from './File';

export type XmlFileConfigStoreConfiguration = { path: string };

export class XmlFileConfigStore extends FileConfigStore {
  constructor({ path }: XmlFileConfigStoreConfiguration) {
    const initialFileState = `
<?xml version="1.1" encoding="UTF-8"?>
<root/>
    `;
    super('xml-file', { path, initialFileState });
  }

  parse(fileContent: string): Config[] {
    let output: Config[] = [];
    const parser = new xml2js.Parser({ explicitArray: false });
    parser.parseString(fileContent, function (error, result) {
      if (error) {
        throw error;
      }
      output = result.root.config;
    });

    return output;
  }

  stringify(nextConfigs: Config[]): string {
    const options = {
      xmldec: {
        version: '1.1',
        encoding: 'UTF-8',
      },
    };
    const builder = new xml2js.Builder(options);
    const xmlObject = { root: { config: nextConfigs } };
    return builder.buildObject(xmlObject);
  }
}
