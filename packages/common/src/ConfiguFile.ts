import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { ConfigSchema, ConfigStore, Expression, JsonSchema, JsonSchemaType } from '@configu/sdk';
import { findUp } from 'find-up';
import { readFile, parseJSON, parseYAML } from './utils';
import { Registry } from './Registry';
import { CfguFile } from './CfguFile';

export interface ConfiguFileContents {
  $schema?: string;
  stores?: Record<string, { type: string; configuration?: Record<string, unknown>; backup?: boolean }>;
  backup?: string;
  schemas?: Record<string, string>;
  scripts?: Record<string, string>;
}

const ConfiguFileSchemaDefs = {
  BooleanProperty: {
    type: 'boolean',
    nullable: true,
  },
  StringProperty: {
    type: 'string',
    minLength: 1,
    nullable: true,
  },
  StringMapProperty: {
    type: 'object',
    required: [],
    additionalProperties: {
      type: 'string',
    },
    nullable: true,
  },
} as const;

const ConfiguFileSchemaId = 'https://raw.githubusercontent.com/configu/configu/main/packages/schema/.configu.json';

export const ConfiguFileSchema: JsonSchemaType<ConfiguFileContents> = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: ConfiguFileSchemaId,
  $comment: 'https://jsonschema.dev/s/3pOmT',
  title: 'JSON Schema for Configu .configu file',
  description: 'https://docs.configu.com/interfaces/.configu',
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    $schema: {
      type: 'string',
      minLength: 1,
      description: 'Url to JSON Schema',
      default: ConfiguFileSchemaId,
      nullable: true,
    },

    stores: {
      type: 'object',
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
      nullable: true,
    },
    backup: ConfiguFileSchemaDefs.StringProperty,
    schemas: ConfiguFileSchemaDefs.StringMapProperty,
    scripts: ConfiguFileSchemaDefs.StringMapProperty,
  },
};

export class ConfiguFile {
  constructor(
    public readonly path: string,
    public readonly contents: ConfiguFileContents,
  ) {
    if (!JsonSchema.validate({ schema: ConfiguFileSchema, data: this.contents })) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${JsonSchema.getLastValidationError()}`);
    }
  }

  private static async init(path: string, contents: string): Promise<ConfiguFile> {
    // expend contents with env vars
    const { value: renderedContents, error } = Expression.parse(`${contents}`).tryEvaluate(process.env);
    if (error || typeof renderedContents !== 'string') {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${error}`);
    }
    // try parse yaml first and then json
    let parsedContents: ConfiguFileContents;
    try {
      parsedContents = parseYAML(path, renderedContents);
    } catch (yamlError) {
      try {
        parsedContents = parseJSON(path, renderedContents);
      } catch (jsonError) {
        throw new Error(`ConfiguFile.contents "${path}" is not a valid JSON or YAML file`);
      }
    }

    return new ConfiguFile(path, parsedContents);
  }

  static async load(path: string): Promise<ConfiguFile> {
    const contents = await readFile(path);
    return ConfiguFile.init(path, contents);
  }

  static async search(): Promise<ConfiguFile> {
    const path = await findUp('.configu', { stopAt: homedir() });
    if (!path) {
      throw new Error('.configu file not found');
    }
    return ConfiguFile.load(path);
  }

  // mergeStoreObject({nameOrType: string, configuration = {}}): { type: string; configuration?: Record<string, unknown> } {
  //   return {
  //     type: this.contents.stores?.[nameOrType]?.type ?? nameOrType,
  //     configuration: { ...this.contents.stores?.[nameOrType]?.configuration, ...configuration },
  //     backup
  //   };
  // const storeType = this.contents.stores?.[nameOrType]?.type ?? nameOrType;
  // const storeConfiguration = { ...this.contents.stores?.[nameOrType]?.configuration, ...configuration };
  // }

  static constructStore(type: string, configuration = {}): ConfigStore {
    const StoreCtor = Registry.store.get(type);
    if (!StoreCtor) {
      throw new Error(`unknown store type ${type}`);
    }

    return new StoreCtor(configuration);
  }

  getStoreInstance(name: string): ConfigStore {
    const storeConfig = this.contents.stores?.[name];
    if (!storeConfig) {
      throw new Error(`Store "${name}" not found`);
    }
    return ConfiguFile.constructStore(storeConfig.type, storeConfig.configuration);
  }

  getBackupStoreInstance(name: string): ConfigStore | undefined {
    const shouldBackup = this.contents.stores?.[name]?.backup;
    if (!shouldBackup) {
      return undefined;
    }
    const database = this.contents.backup ?? join(dirname(this.path), 'config.backup.sqlite');
    return ConfiguFile.constructStore('sqlite', { database, tableName: name });
  }

  async getSchemaInstance(name: string): Promise<ConfigSchema> {
    const schemaPath = this.contents.schemas?.[name];
    if (!schemaPath) {
      throw new Error(`Schema "${name}" not found`);
    }

    const cfguFile = await CfguFile.load(schemaPath);
    return cfguFile.constructSchema();
  }

  runScript(name: string, cwd?: string): void {
    const script = this.contents.scripts?.[name];
    if (!script) {
      throw new Error(`Script "${name}" not found`);
    }

    const scriptRunDir = cwd ?? dirname(resolve(this.path));

    spawnSync(script, {
      cwd: scriptRunDir,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
  }
}
