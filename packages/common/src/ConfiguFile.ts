import { arch, platform } from 'node:os';
import { cwd } from 'node:process';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { _, JSONSchema, JSONSchemaObject, FromSchema } from '@configu/sdk/expressions';
import { ConfigStore, ConfigExpression, ConfigStoreConstructor, ConfigKey } from '@configu/sdk';
import {
  console,
  path as pathe,
  environment,
  findUp,
  findUpMultiple,
  glob,
  readFile,
  importModule,
  getConfiguHomeDir,
  parseJSON,
  parseYAML,
  YAML,
  pathExists,
  normalizeInput,
} from './utils';
import { CfguFile } from './CfguFile';

const { join, dirname, resolve } = pathe;

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
// const ConfiguFileSchemaId = 'https://files.configu.com/schema/.configu.json';

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
          default: { type: 'boolean' },
        },
      },
    },
    backup: StringPropertySchema,
    schemas: StringMapPropertySchema,
    scripts: StringMapPropertySchema,
    // todo: add ticket to support register api
    register: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
  },
} as const satisfies JSONSchemaObject;

export type ConfiguFileContents = FromSchema<typeof ConfiguFileSchema>;

export class ConfiguFile {
  public static readonly schema = ConfiguFileSchema;
  public readonly dir: string;

  constructor(
    public readonly path: string,
    public readonly contents: ConfiguFileContents,
    public readonly contentsType: 'json' | 'yaml',
  ) {
    console.debug('ConfiguFile.constructor', { path, contents, contentsType });
    try {
      this.dir = dirname(resolve(this.path));
      JSONSchema.validate(ConfiguFile.schema, this.contents);
    } catch (error) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${error.message}`);
    }
  }

  private static async init(path: string, contents: string): Promise<ConfiguFile> {
    console.debug('ConfiguFile.init', { path });
    // try expend contents with env vars
    let renderedContents: string;
    try {
      renderedContents = ConfigExpression.evaluateTemplateString(contents, { ...process.env });
    } catch (error) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${error}`);
    }

    // try parse yaml first and then json
    let parsedContents: ConfiguFileContents;
    let contentsType: 'json' | 'yaml';
    try {
      parsedContents = parseYAML(path, renderedContents);
      contentsType = 'yaml';
    } catch (yamlError) {
      try {
        parsedContents = parseJSON(path, renderedContents);
        contentsType = 'json';
      } catch (jsonError) {
        throw new Error(
          `ConfiguFile.contents "${path}" is not a valid JSON or YAML file\n${yamlError.message}\n${jsonError.message}`,
        );
      }
    }

    // handle register api
    const registerPromises = (parsedContents.register ?? []).map((module, index) => {
      const registeree = `.configu.register[${index}]`;
      const { type, path: registereePath } = normalizeInput(module, registeree);
      if (type === 'file') {
        return ConfiguFile.registerModuleFile(registereePath);
      }
      throw new Error(`invalid registeree input at ${registeree} "${module}"`);
    });
    await Promise.all(registerPromises);

    return new ConfiguFile(path, parsedContents, contentsType);
  }

  static async load(path: string): Promise<ConfiguFile> {
    console.debug('ConfiguFile.load', { path });

    if (!path.endsWith('.configu')) {
      throw new Error(`ConfiguFile.path "${path}" is not a valid .configu file`);
    }

    let contents: string;
    try {
      contents = await readFile(path);
    } catch (error) {
      throw new Error(`ConfiguFile.path "${path} is not readable\n${error.message}`);
    }

    return ConfiguFile.init(path, contents);
  }

  static async loadFromInput(input: string) {
    console.debug('ConfiguFile.loadFromInput', { input });

    const { type, path } = normalizeInput(input, '.configu');
    if (type === 'json') {
      return ConfiguFile.init(join(cwd(), '.configu'), input);
    }
    if (type === 'file') {
      return ConfiguFile.load(path);
    }
    // todo: support http based urls
    // code below is unreachable
    throw new Error('.configu file input is not a valid path or JSON');
  }

  static async searchClosest() {
    // todo: think about adding the stopAt option.
    return findUp('.configu', { type: 'file', allowSymlinks: false });
  }

  static async searchAll() {
    return findUpMultiple('.configu', { type: 'file', allowSymlinks: false });
  }

  async save(contents: ConfiguFileContents) {
    const mergedContents = _.merge({}, this.contents, contents) satisfies ConfiguFileContents;
    let renderedContents: string;
    if (this.contentsType === 'json') {
      renderedContents = JSON.stringify(mergedContents, null, 2);
    } else {
      renderedContents = YAML.stringify(mergedContents);
    }
    await fs.writeFile(this.path, renderedContents);
    return ConfiguFile.load(this.path);
  }

  private getDefaultStoreName() {
    const storeNames = Object.keys(this.contents.stores ?? {});
    if (storeNames.length === 1) {
      return storeNames[0] as string;
    }
    const defaultStoreName = _.findKey(this.contents.stores, (store) => store.default);
    return defaultStoreName ?? '';
  }

  async getStoreInstance(name?: string) {
    const storeConfig = this.contents.stores?.[name ?? this.getDefaultStoreName()];
    if (!storeConfig) {
      return undefined;
    }
    return ConfiguFile.constructStore(storeConfig.type, storeConfig.configuration);
  }

  async getBackupStoreInstance(name?: string) {
    const shouldBackup = this.contents.stores?.[name ?? this.getDefaultStoreName()]?.backup;
    if (!shouldBackup) {
      return undefined;
    }

    const database = this.contents.backup ?? join(this.dir, 'configs_backup.sqlite');
    return ConfiguFile.constructStore('sqlite', { database, tableName: name });
  }

  async getSchemaInstance(name: string) {
    const schemaConfig = this.contents.schemas?.[name];
    if (!schemaConfig) {
      return undefined;
    }
    return CfguFile.constructSchema(schemaConfig);
  }

  runScript(name: string, options: { cwd?: string; env?: Record<string, string> } = {}) {
    const script = this.contents.scripts?.[name];
    if (!script) {
      return undefined;
    }
    const result = spawnSync(script, {
      cwd: options.cwd ?? this.dir,
      stdio: 'inherit',
      env: { ...process.env, ...options.env },
      shell: true,
    });
    return result.status;
  }

  private static async registerModule(module: Record<string, unknown>) {
    Object.entries(module).forEach(([key, value]) => {
      if (key === 'default') {
        return;
      }
      console.debug('Registering module property', key);
      if (typeof value === 'function' && 'type' in value) {
        console.debug('Registering ConfigStore:', value.type);
        ConfigStore.register(value as ConfigStoreConstructor);
      } else if (typeof value === 'function') {
        console.debug('Registering ConfigExpression:', key);
        ConfigExpression.register(key, value);
      } else {
        console.debug('Ignore registeree:', key);
      }
    });
  }

  static async registerModuleFile(filePath: string) {
    const module = await importModule(filePath);
    ConfiguFile.registerModule(module as any);
  }

  static async registerStore(type: string, version: string = 'latest') {
    console.debug(`Registering store`, { type, version });

    const moduleDirPath = await getConfiguHomeDir('cache');
    const modulePath = join(moduleDirPath, `/${type}-${version}.js`);

    // todo: add sem-ver check for cache invalidation when cached stores are outdated once integration pipeline is reworked

    const isModuleExists = await pathExists(modulePath);
    if (!isModuleExists) {
      const remoteUrl = `https://github.com/configu/configu/releases/download/stores%2F${type}%2F${version}/${type}-${platform()}-${arch()}.js`;
      console.debug('Downloading store module:', remoteUrl);
      const res = await fetch(remoteUrl);

      if (res.ok) {
        await fs.writeFile(modulePath, await res.text());
        console.debug('Fetched module successfully', modulePath);
      } else {
        throw new Error(`store ${type} not found`);
      }
    } else {
      console.debug('Store module already exists', modulePath);
    }

    return ConfiguFile.registerModuleFile(modulePath);
  }

  static async constructStore(input: string, configuration = {}) {
    // input is a "store-type@channel/semver-version" string
    console.debug('ConfiguFile.constructStore', { input, configuration });
    const [rawType = '', version] = input.split('@');
    if (!rawType) {
      throw new Error('store type is missing');
    }
    // normalize the type to ensure that the store is registered correctly
    const type = ConfigKey.normalize(rawType);

    // todo: remember to mention in docs that store types cannot be overridden
    if (!ConfigStore.has(type)) {
      await ConfiguFile.registerStore(type, version);
    }
    return ConfigStore.construct(type, configuration);
  }
}
