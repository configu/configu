import _ from 'lodash';
import { cosmiconfig, CosmiconfigResult } from 'cosmiconfig';
import { JsonSchemaType, TMPL, JSON_SCHEMA, ConfigStore, ConfigSchema, ConfigSchemaContents } from '@configu/ts';
import nodePath from 'path';
import { SQLiteConfigStore } from '@configu/node';
import { spawnSync } from 'child_process';
import { constructStore } from './ConfigStoreConstructor';

const ALLOWED_CFGU_EXT = ['json', 'yaml', 'yml'];

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
  constructor(
    public readonly path: string,
    public readonly contents: ConfiguFileContents,
  ) {
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
      return new ConfiguFile(result.filepath, configData);
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

    return this.parseLoadResult(result);
  }

  static async loadFromSearch(): Promise<ConfiguFile> {
    const explorer = cosmiconfig('configu', {
      searchPlaces: ['.configu'],
      searchStrategy: 'global',
    });
    const result = await explorer.search();

    return this.parseLoadResult(result);
  }

  async getStoreInstance({
    storeName,
    cacheDir,
    configuration,
    version,
  }: {
    storeName: string;
    cacheDir: string;
    configuration?: Record<string, unknown>;
    version?: string;
  }): Promise<ConfigStore> {
    const storeConfig = this.contents.stores?.[storeName];
    if (!storeConfig) {
      throw new Error(`Store "${storeName}" not found`);
    }
    return constructStore(storeConfig.type, storeConfig.configuration);
  }

  async getBackupStoreInstance({
    storeName,
    cacheDir,
    configuration,
    version,
  }: {
    storeName: string;
    cacheDir: string;
    configuration?: Record<string, unknown>;
    version?: string;
  }): Promise<ConfigStore> {
    const database = this.contents.backup ?? nodePath.join(nodePath.dirname(this.path), 'config.backup.sqlite');
    return new SQLiteConfigStore({
      database,
      tableName: storeName,
    });
  }

  runScript({ scriptName, directory }: { scriptName: string; directory?: string }) {
    let cwd: string;

    if (directory) cwd = nodePath.resolve(directory);
    else cwd = nodePath.dirname(this.path);

    const script = this.contents.scripts?.[scriptName];
    if (!script) {
      throw new Error(`Script "${scriptName}" is not presented at ${cwd}`);
    }

    spawnSync(script, {
      cwd,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
  }

  // TODO: temporary placement of this method in a separate class
  async loadSchema({ recursive }: { recursive?: boolean } = {}): Promise<ConfigSchema | undefined> {
    // TODO: this doesn't support a dynamic name
    const explorer = cosmiconfig('cfgu', {
      searchPlaces: ALLOWED_CFGU_EXT.map((ext) => `cfgu.${ext}`),
      searchStrategy: recursive ? 'global' : 'none',
    });
    const result = await explorer.search();
    if (!result) return undefined;

    return new ConfigSchema('placeholder', result.config as unknown as ConfigSchemaContents);
  }
}
