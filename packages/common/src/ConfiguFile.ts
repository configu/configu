import { homedir, platform } from 'node:os';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { join, dirname, resolve } from 'pathe';
import { findUp } from 'find-up';
import {
  ConfigSchema,
  ConfigStore,
  ConfigExpression,
  JSONSchema,
  JSONSchemaObject,
  FromSchema,
  ConfigStoreConstructor,
} from '@configu/sdk';
import { glob } from 'glob';
import _ from 'lodash';
import { readFile, importModule, getConfiguHomeDir, parseJSON, parseYAML } from './utils';
import { CfguFile } from './CfguFile';

// interface ConfiguFileContents {
//   $schema?: string;
//   stores?: Record<string, { type: string; configuration?: Record<string, unknown>; backup?: boolean }>;
//   backup?: string;
//   schemas?: Record<string, string>;
//   scripts?: Record<string, string>;
// }

// const ConfiguFileSchemaDefs = {
//   BooleanProperty: {
//     type: 'boolean',
//     nullable: true,
//   },
//   StringProperty: {
//     type: 'string',
//     minLength: 1,
//     nullable: true,
//   },
//   StringMapProperty: {
//     type: 'object',
//     required: [],
//     additionalProperties: {
//       type: 'string',
//     },
//     nullable: true,
//   },
// } as const;

const StringPropertySchema = {
  type: 'string',
  minLength: 1,
} as const satisfies JSONSchemaObject;
const StringMapPropertySchema = {
  type: 'object',
  required: [],
  additionalProperties: {
    type: 'string',
  },
} as const satisfies JSONSchemaObject;

const ConfiguFileSchemaId = 'https://raw.githubusercontent.com/configu/configu/main/packages/schema/.configu.json';

const ConfiguFileSchema = {
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
      // default: ConfiguFileSchemaId,
      // nullable: true,
    },

    stores: {
      type: 'object',
      required: [],
      additionalProperties: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' },
          configuration: { type: 'object' },
          backup: { type: 'boolean' },
        },
      },
      // nullable: true,
    },
    backup: StringPropertySchema,
    schemas: StringMapPropertySchema,
    scripts: StringMapPropertySchema,
    // todo: add ticket to support register api
  },
} as const satisfies JSONSchemaObject;

export type ConfiguFileContents = FromSchema<typeof ConfiguFileSchema>;

const BACKUP_STORE_TYPE = 'sqlite';

export class ConfiguFile {
  public static readonly flags = ConfiguFileSchemaId;
  public static readonly envs = ['CONFIGU_CONFIG', 'CONFIGU_CONFIG_CONFIGURATIONS'];
  // public static readonly cacheDirName = '/cache';
  public static readonly schema = ConfiguFileSchema;
  constructor(
    public readonly path: string,
    public readonly contents: ConfiguFileContents,
  ) {
    try {
      JSONSchema.validate(ConfiguFile.schema, this.contents);
    } catch (error) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${error.message}`);
    }
  }

  private static async init(path: string, contents: string): Promise<ConfiguFile> {
    // try expend contents with env vars
    let renderedContents: string;
    try {
      // todo: find a way to escape template inside Expression class
      renderedContents = ConfigExpression.evaluateTemplateString(contents, process.env);
    } catch (error) {
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

  async getStoreInstance(name: string, configuration?: Record<string, unknown>) {
    const storeConfig = this.contents.stores?.[name];
    if (!storeConfig) {
      return undefined;
    }
    // todo: remember to mention in docs that integration stores cannot be overriden
    if (!ConfigStore.has(storeConfig.type)) {
      await ConfiguFile.registerStore(storeConfig.type);
    }
    return ConfigStore.construct(storeConfig.type, { ...configuration, ...storeConfig.configuration });
  }

  async getBackupStoreInstance(name: string) {
    const shouldBackup = this.contents.stores?.[name]?.backup;
    if (!shouldBackup) {
      return undefined;
    }
    const database = this.contents.backup ?? join(dirname(this.path), 'config.backup.sqlite');
    if (!ConfigStore.has(BACKUP_STORE_TYPE)) {
      await ConfiguFile.registerStore(BACKUP_STORE_TYPE);
    }
    return ConfigStore.construct(BACKUP_STORE_TYPE, { database, tableName: name });
  }

  private mergeSchemas(...schemas: ConfigSchema[]): ConfigSchema {
    return new ConfigSchema(_.merge({}, ...schemas.map((schema) => schema.keys)));
  }

  async getSchemaInstance(name: string) {
    const schemaPath = this.contents.schemas?.[name];
    if (!schemaPath) {
      return undefined;
    }
    // todo: try to replace glob lib with the native fs.glob api
    const cfguFiles = await glob(schemaPath, { nodir: true });
    if (cfguFiles.length === 0) {
      return undefined;
    }

    // Later schemas take precedence in case of key duplication.
    const sortedCfguFiles = cfguFiles.sort((a, b) => a.split('/').length - b.split('/').length);

    const configSchemasPromises = sortedCfguFiles.map(async (cfguFile) => {
      const cfgu = await CfguFile.load(cfguFile);
      return cfgu.constructSchema();
    });
    const configSchemas = await Promise.all(configSchemasPromises);

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

  private static async registerModule(module: Record<string, unknown>) {
    Object.entries(module).forEach(([key, value]) => {
      // console.log('Registering:', key, value);

      if (key === 'default') {
        return;
      }
      if (typeof value === 'function' && 'type' in value) {
        // console.log('Registering ConfigStore:', value.type);
        ConfigStore.register(value as ConfigStoreConstructor);
      } else if (typeof value === 'function') {
        // console.log('Registering ConfigExpression:', key);
        ConfigExpression.register(key, value);
      } else {
        // console.log('ignore registeree:', key);
      }
    });
  }

  static async registerModuleFile(filePath: string) {
    const module = await importModule(filePath);
    ConfiguFile.registerModule(module);
  }

  static async registerStore(type: string) {
    const moduleDirPath = await getConfiguHomeDir('cache');
    const modulePath = join(moduleDirPath, `/${type}.js`);

    // todo: add sem-ver check for cache invalidation when cached stores are outdated once integration pipeline is reworked
    // const [KEY, VERSION = 'latest'] = type.split('@');
    const version = 'latest';

    const isModuleExists = await fs
      .access(modulePath)
      .then(() => true)
      .catch(() => false);

    if (!isModuleExists) {
      const res = await fetch(
        `https://github.com/configu/configu/releases/download/integrations-${version}/${type}.os-${platform()}.js`,
      );

      if (res.ok) {
        await fs.writeFile(modulePath, await res.text());
      } else {
        throw new Error(`remote integration ${type} not found`);
      }
    }

    await ConfiguFile.registerModuleFile(modulePath);
  }
}
