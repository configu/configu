import _ from 'lodash';
import { cosmiconfig, CosmiconfigResult } from 'cosmiconfig';
import { JsonSchemaType, TMPL, JSON_SCHEMA, ConfigStore } from '@configu/ts';

type StoreConfigurationObject = { type: string; configuration?: Record<string, unknown>; backup?: boolean };
export type ConfiguFileContents = Partial<{
  $schema: string;
  stores: Record<string, StoreConfigurationObject>;
  backup: string;
  schemas: Record<string, string>;
  scripts: Record<string, string>;
}>;

export const ConfiguFileContents: JsonSchemaType<ConfiguFileContents> = {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    $schema: { type: 'string', nullable: true },
    stores: {
      type: 'object',
      nullable: true,
      required: [],
      additionalProperties: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' },
          configuration: { type: 'object', nullable: true },
          backup: { type: 'boolean', nullable: true },
        },
      },
    },
    backup: { type: 'string', nullable: true },
    schemas: {
      type: 'object',
      nullable: true,
      required: [],

      additionalProperties: { type: 'string' },
    },
    scripts: {
      type: 'object',
      nullable: true,
      required: [],
      additionalProperties: { type: 'string' },
    },
  },
};

export class ConfiguFile {
  constructor(public readonly contents: ConfiguFileContents) {
    if (!JSON_SCHEMA(ConfiguFileContents, this.contents)) {
      throw new Error(`ConfiguFile.contents is invalid`);
    }
  }

  static parseLoadResult(result: CosmiconfigResult) {
    if (!result) throw new Error('no configuration file found');
    try {
      const stringifiedContents = JSON.stringify(result.config);
      const compiledCliConfigData = TMPL.render(stringifiedContents, {
        ...process.env,
        ..._.mapKeys(process.env, (k) => `${k}`),
      });
      const configData = JSON.parse(compiledCliConfigData);
      return configData;
    } catch (error) {
      throw new Error(`invalid configuration file ${error.message}`);
    }
  }

  static async loadFromPath(filePath: string): Promise<ConfiguFile> {
    let result: CosmiconfigResult;
    try {
      result = await cosmiconfig('configu').load(filePath);
    } catch (error) {
      // * https://nodejs.org/api/errors.html#errors_common_system_errors
      if (error.code === 'ENOENT') {
        throw new Error('no such file or directory');
      }
      if (error.code === 'EISDIR') {
        throw new Error('expected a file, but the given path was a directory');
      }

      throw error;
    }

    const contents = this.parseLoadResult(result);
    return new ConfiguFile(contents);
  }

  static async loadFromSearch(): Promise<ConfiguFile> {
    const explorer = cosmiconfig('configu', {
      searchPlaces: ['.configu'],
      searchStrategy: 'global',
    });
    const result = await explorer.search();

    const contents = this.parseLoadResult(result);
    return new ConfiguFile(contents);
  }

  // getStoreInstance(storeName?: string): ConfigStore {}
  // getBackupStoreInstance(storeName?: string): ConfigStore {}
}
