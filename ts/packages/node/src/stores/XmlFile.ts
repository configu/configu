import xml2js from 'xml2js';
import { type Config } from '@configu/ts';
import _ from 'lodash';
import { FileConfigStore } from './File';

export type XmlFileConfigStoreConfiguration = { path: string };

export class XmlFileConfigStore extends FileConfigStore {
  constructor({ path }: XmlFileConfigStoreConfiguration) {
    const initialFileState = `
<?xml version="1.0" encoding="UTF-8"?>
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
      const sets = _.get(result, 'root.set', []);
      const keys = _.get(result, 'root.key', []);
      const values = _.get(result, 'root.value', []);
      output = _.zipWith(sets, keys, values, (set: string, key: string, value: string) => ({
        set,
        key,
        value,
      }));
    });

    return output;
  }

  stringify(nextConfigs: Config[]): string {
    const builder = new xml2js.Builder();
    const xmlObject = { root: nextConfigs }; // Assuming 'root' as the main element
    return builder.buildObject(xmlObject);
  }
}
