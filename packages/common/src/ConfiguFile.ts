import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'pathe';
import { findUp } from 'find-up';
import { ConfigSchema, ConfigStore, Expression, JsonSchema, JsonSchemaType } from '@configu/sdk';
import FastGlob from 'fast-glob';
import _ from 'lodash';
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
    if (!JsonSchema.validate({ schema: ConfiguFileSchema, path, data: this.contents })) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${JsonSchema.getLastValidationError()}`);
    }
  }

  private static async init(path: string, contents: string): Promise<ConfiguFile> {
    // expend contents with env vars
    // todo: find a way to escape template inside Expression class
    const { value: renderedContents, error } = Expression.parse(`\`${contents}\``).tryEvaluate(process.env);
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

  getStoreInstance(name: string, configuration?: Record<string, unknown>) {
    const storeConfig = this.contents.stores?.[name];
    if (!storeConfig) {
      return undefined;
    }
    return Registry.constructStore(storeConfig.type, { ...configuration, ...storeConfig.configuration });
  }

  getBackupStoreInstance(name: string) {
    const shouldBackup = this.contents.stores?.[name]?.backup;
    if (!shouldBackup) {
      return undefined;
    }
    const database = this.contents.backup ?? join(dirname(this.path), 'config.backup.sqlite');
    return Registry.constructStore('sqlite', { database, tableName: name });
  }

  async getSchemaInstance(name: string) {
    const schemaPath = this.contents.schemas?.[name];
    if (!schemaPath) {
      return undefined;
    }
    let cfguFiles = FastGlob.sync(schemaPath);
    if (cfguFiles.length === 0) {
      return undefined;
    }

    cfguFiles = cfguFiles.sort((a, b) => a.split('/').length - b.split('/').length);
    const configSchemas = await Promise.all(
      cfguFiles.map(async (cfguFile) => {
        const cfgu = await CfguFile.load(cfguFile);
        return cfgu.constructSchema();
      }),
    );

    return this.mergeSchemas(...configSchemas);
  }

  runScript(name: string, options: { cwd?: string; env?: Record<string, string> } = {}): void {
    const script = this.contents.scripts?.[name];
    if (!script) {
      throw new Error(`Script "${name}" not found`);
    }

    const scriptRunDir = options.cwd ?? dirname(resolve(this.path));

    const { env, ...restOpts } = options;
    spawnSync(script, {
      cwd: scriptRunDir,
      stdio: 'inherit',
      env: { ...process.env, ...env },
      shell: true,
      ...restOpts,
    });
  }

  private mergeSchemas(...schemas: ConfigSchema[]): ConfigSchema {
    // Later schemas take precedence in case of key duplication.
    return new ConfigSchema(_.merge({}, ...schemas.map((schema) => schema.keys)));
  }
}
