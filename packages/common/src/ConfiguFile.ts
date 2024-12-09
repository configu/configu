import { arch, homedir, platform } from 'node:os';
import { cwd } from 'node:process';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'pathe';
import { _, JSONSchema, JSONSchemaObject, FromSchema } from '@configu/sdk/expressions';
import { ConfigSchema, ConfigStore, ConfigExpression, ConfigStoreConstructor, ConfigKey } from '@configu/sdk';
import {
  console,
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
} from './utils';
import { CfguFile } from './CfguFile';

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
    try {
      this.dir = dirname(resolve(this.path));
      JSONSchema.validate(ConfiguFile.schema, this.contents);
    } catch (error) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${error.message}`);
    }
  }

  private static async init(path: string, contents: string): Promise<ConfiguFile> {
    // try expend contents with env vars
    let renderedContents: string;
    try {
      renderedContents = ConfigExpression.evaluateTemplateString(contents, environment.env);
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
    const registerPromises = (parsedContents.register ?? []).map((module) => ConfiguFile.register(module));
    await Promise.all(registerPromises);

    return new ConfiguFile(path, parsedContents, contentsType);
  }

  static async load(path: string): Promise<ConfiguFile> {
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
    // Check if the string is a valid URL
    let url: URL | undefined;
    try {
      url = new URL(input);
    } catch {
      // Not a valid URL
    }
    if (url) {
      if (url.protocol === 'file:') {
        return ConfiguFile.load(fileURLToPath(url));
      }
      // todo: support http based urls
      throw new Error('Only file URLs are supported');
    }

    // Check if the string is a valid path
    try {
      const path = resolve(input);
      return ConfiguFile.load(path);
    } catch {
      // Not a valid path
    }

    // Check if the string is a valid JSON
    try {
      const json = JSON.parse(input);
      return ConfiguFile.init(join(cwd(), '.configu'), json);
    } catch {
      // Not a valid JSON
    }

    throw new Error('.configu file input is not a valid path, URL, or JSON');
  }

  static async searchClosest() {
    return findUp('.configu', { stopAt: homedir() });
  }

  static async searchAll() {
    return findUpMultiple('.configu', { stopAt: homedir() });
  }

  async save(contents: ConfiguFileContents) {
    const mergedContents = { ...this.contents, ...contents };
    let renderedContents: string;
    if (this.contentsType === 'json') {
      renderedContents = JSON.stringify(mergedContents, null, 2);
    } else {
      renderedContents = YAML.stringify(mergedContents);
    }
    await fs.writeFile(this.path, renderedContents);
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
    if (!this.contents.stores) {
      return undefined;
    }
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
    const schemaPath = this.contents.schemas?.[name];
    if (!schemaPath) {
      return undefined;
    }
    const paths = await glob(name, { nodir: true });
    if (paths.length > 1) {
      return CfguFile.constructSchema(...paths);
    }
    return CfguFile.constructSchema(schemaPath);
  }

  runScript(name: string, options: { cwd?: string; env?: Record<string, string> } = {}): void {
    const script = this.contents.scripts?.[name];
    if (!script) {
      throw new Error(`Script "${name}" not found`);
    }
    spawnSync(script, {
      cwd: options.cwd ?? this.dir,
      stdio: 'inherit',
      env: { ...environment.env, ...options.env },
      shell: true,
    });
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

  static async register(input: string) {
    let url: URL | undefined;
    try {
      url = new URL(input);
    } catch {
      // Not a valid URL
    }
    if (url) {
      if (url.protocol === 'file:') {
        return ConfiguFile.registerModuleFile(fileURLToPath(url));
      }
      // todo: support http based urls
      throw new Error('Only file URLs are supported');
    }

    try {
      const path = resolve(input);
      return ConfiguFile.registerModuleFile(path);
    } catch {
      // Not a valid path
    }

    throw new Error(`failed to register module ${input}`);
  }

  static destructStoreInput(typeAndVersion: string) {
    const [t = '', version = 'latest'] = typeAndVersion.split('@');
    const type = ConfigKey.normalize(t);
    return {
      type,
      version,
    };
  }

  static async registerStore(typeAndVersion: string) {
    console.debug(`Registering store: ${typeAndVersion}`);
    const { type, version } = this.destructStoreInput(typeAndVersion);

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
        throw new Error(`remote integration ${type} not found`);
      }
    } else {
      console.debug('Store module already exists', modulePath);
    }

    return ConfiguFile.registerModuleFile(modulePath);
  }

  static async constructStore(typeAndVersion: string, configuration = {}) {
    // todo: remember to mention in docs that integration stores cannot be overridden
    const { type } = this.destructStoreInput(typeAndVersion);
    if (!ConfigStore.has(type)) {
      await ConfiguFile.registerStore(typeAndVersion);
    }
    return ConfigStore.construct(type, configuration);
  }
}
