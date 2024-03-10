import xml2js from 'xml2js';
import { type Config } from '@configu/ts';
import { FileConfigStore } from './File';

export type XmlFileConfigStoreConfiguration = { path: string; builderOptions?: xml2js.BuilderOptions };

export class XmlFileConfigStore extends FileConfigStore {
  private builder: xml2js.Builder;
  constructor({ path, builderOptions }: XmlFileConfigStoreConfiguration) {
    const builder = new xml2js.Builder(builderOptions);
    const initialFileState = builder.buildObject({ root: { config: [] } });
    super('xml-file', { path, initialFileState });
    this.builder = builder;
  }

  parse(fileContent: string): Config[] {
    let output: Config[] = [];
    const parser = new xml2js.Parser({ explicitArray: false });
    parser.parseString(fileContent, (error, result) => {
      if (error) {
        throw error;
      }
      output = result.root.config ?? [];
    });

    return output;
  }

  stringify(nextConfigs: Config[]): string {
    const xmlObject = { root: { config: nextConfigs } };
    return this.builder.buildObject(xmlObject);
  }
}
