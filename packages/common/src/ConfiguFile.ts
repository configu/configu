import { cwd } from 'node:process';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { ConfigStore, ConfigExpression, _, JSONSchema, JSONSchemaObject, FromSchema } from '@configu/sdk';
import {
  debug,
  path as pathe,
  findUp,
  findUpMultiple,
  readFile,
  parseJsonFile,
  parseYamlFile,
  YAML,
  normalizeInput,
  configuFilesApi,
  AllowedExtension,
} from './utils';
import { ConfiguModule } from './ConfiguModule';
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

// https://raw.githubusercontent.com/configu/configu/main/packages/schema/.configu.json
const ConfiguFileSchemaId = `${configuFilesApi.defaults.baseURL}/schema/.configu.json`;

const ConfiguFileVersionPropertiesSchema = (subject: string) =>
  ({
    version: {
      description: `The version of the ${subject} to use.`,
      type: 'string',
      default: 'latest',
    },
    'version-policy': {
      description: `The version policy of the ${subject} to enforce.`,
      type: 'string',
      enum: ['ignore', 'warn', 'error'],
      default: 'warn',
    },
  }) as const;

const ConfiguFileInterfacePropertySchema = {
  description: 'Global configuration for a Configu interface.',
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    debug: {
      description: 'Enables or disables debug mode.',
      type: 'boolean',
    },
    // todo: add repository for configu to determine template source
    // repository: {
    //   description: '',
    //   type: 'string',
    //   format: 'uri',
    // },
    // todo: add registry for npm to determine js package source
    // registry: {
    //   description: '',
    //   type: 'string',
    //   format: 'uri',
    // },
    // todo: add platform-api to determine `configu login` source
    // configuPlatformApi: {
    //   description: '',
    //   type: 'string',
    //   format: 'uri',
    // },
    // todo: add version props for engine, cli, proxy.
    // engine: {
    //   description: 'Configuration for Node.js engine.',
    //   type: 'object',
    //   required: [],
    //   additionalProperties: false,
    //   properties: {
    //     ...ConfiguFileVersionPropertiesSchema('engine'),
    //   },
    // },
    // cli: {
    //   description: 'Configuration for the Configu CLI.',
    //   type: 'object',
    //   required: [],
    //   additionalProperties: false,
    //   properties: {
    //     ...ConfiguFileVersionPropertiesSchema('cli'),
    //   },
    // },
    proxy: {
      description: 'Configuration for the Configu proxy server.',
      type: 'object',
      required: [],
      additionalProperties: false,
      properties: {
        // ...ConfiguFileVersionPropertiesSchema('proxy'),
        host: {
          description: 'The host address of the proxy server.',
          type: 'string',
          // default: '0.0.0.0',
        },
        domain: {
          description: 'The domain of the proxy server.',
          type: 'string',
          // default: 'localhost',
        },
        // trust: {
        //   description: 'Enables or disables X-Forwarded-* headers.',
        //   type: 'boolean',
        //   // default: false,
        // },
        tls: {
          type: 'object',
          required: ['enabled', 'cert', 'key'],
          additionalProperties: false,
          properties: {
            enabled: {
              description: 'Enables or disables transport layer security (TLS).',
              type: 'boolean',
              default: false,
            },
            cert: {
              description: 'The (absolute) file path of the certificate to use for the TLS connection.',
              type: 'string',
            },
            key: {
              description: 'The (absolute) file path of the TLS key that should be used for the TLS connection.',
              type: 'string',
            },
          },
        },
        auth: {
          type: 'object',
          required: [],
          additionalProperties: false,
          properties: {
            // method: {
            //   description: 'The authentication method to use.',
            //   type: 'string',
            //   enum: ['none', 'basic', 'bearer'],
            //   default: 'none',
            // },
            // basic: {},
            bearer: {
              description: 'Enables or disables preshared key authentication.',
              type: 'object',
              required: ['keys'],
              additionalProperties: false,
              properties: {
                keys: {
                  description: 'List of preshared keys that are allowed to access the server.',
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  minItems: 1,
                },
              },
            },
            // oidc: {
            //   description: "The OIDC provider specific settings. This must be set if 'authn.method=oidc'.",
            //   $ref: '#/definitions/oidc',
            // },
          },
        },
        http: {
          type: 'object',
          required: [],
          additionalProperties: false,
          properties: {
            enabled: {
              description: 'Enables or disables the HTTP server.',
              type: 'boolean',
              // default: true,
            },
            port: {
              description: 'The host port to serve the HTTP server on.',
              type: 'number',
              // default: 8080,
            },
          },
        },
        // sse: {},
        // grpc: {},
        // ws: {},
        // graphql: {},
      },
    },
  },
} as const satisfies JSONSchemaObject;

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
    interface: ConfiguFileInterfacePropertySchema,
    stores: {
      type: 'object',
      required: [],
      additionalProperties: {
        type: 'object',
        required: ['type'],
        additionalProperties: false,
        properties: {
          type: { type: 'string' },
          version: { type: 'string' },
          configuration: { type: 'object' },
          backup: { type: 'boolean' },
          default: { type: 'boolean' },
        },
      },
    },
    backup: StringPropertySchema,
    schemas: StringMapPropertySchema,
    register: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    scripts: StringMapPropertySchema,
  },
} as const satisfies JSONSchemaObject;

export type ConfiguFileContents = FromSchema<typeof ConfiguFileSchema>;
export type ConfiguFileInterfaceConfig = FromSchema<typeof ConfiguFileInterfacePropertySchema>;

type StoreConfig = FromSchema<typeof ConfiguFileSchema.properties.stores.additionalProperties>;

export class ConfiguFile {
  public static readonly schema = ConfiguFileSchema;
  public static readonly lookupName = `.configu`;

  public readonly dir: string;
  constructor(
    public readonly path: string,
    public readonly contents: ConfiguFileContents,
    public readonly contentsType: Exclude<AllowedExtension, 'yml'>,
  ) {
    debug('ConfiguFile.constructor', { path, contents, contentsType });
    try {
      this.dir = dirname(resolve(this.path));
      JSONSchema.validate(ConfiguFile.schema, this.contents);
    } catch (error) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${error.message}`);
    }
  }

  private static async init(path: string, contents: string): Promise<ConfiguFile> {
    debug('ConfiguFile.init', { path });
    // try expend contents with env vars
    let renderedContents: string;
    try {
      renderedContents = ConfigExpression.evaluateTemplateString(contents, { ...process.env });
    } catch (error) {
      throw new Error(`ConfiguFile.contents "${path}" is invalid\n${error}`);
    }

    // try parse yaml first and then json
    let parsedContents: ConfiguFileContents;
    let contentsType: typeof ConfiguFile.prototype.contentsType;
    try {
      parsedContents = parseYamlFile(path, renderedContents);
      contentsType = 'yaml';
    } catch (yamlError) {
      try {
        parsedContents = parseJsonFile(path, renderedContents);
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
        return ConfiguModule.registerFile(registereePath);
      }
      throw new Error(`invalid registeree input at ${registeree} "${module}"`);
    });
    await Promise.all(registerPromises);

    return new ConfiguFile(path, parsedContents, contentsType);
  }

  public static async load(path: string): Promise<ConfiguFile> {
    debug('ConfiguFile.load', { path });

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

  public static async loadFromInput(input: string) {
    debug('ConfiguFile.loadFromInput', { input });

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

  public static async searchClosest() {
    // todo: think about adding the stopAt option.
    return findUp(ConfiguFile.lookupName, { type: 'file', allowSymlinks: false });
  }

  public static async searchAll() {
    return findUpMultiple(ConfiguFile.lookupName, { type: 'file', allowSymlinks: false });
  }

  public async save(contents: ConfiguFileContents) {
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
    return ConfiguFile.constructStore(storeConfig);
  }

  async getBackupStoreInstance(name?: string) {
    const shouldBackup = this.contents.stores?.[name ?? this.getDefaultStoreName()]?.backup;
    if (!shouldBackup) {
      return undefined;
    }
    const database = this.contents.backup ?? join(this.dir, 'configs_backup.sqlite');
    return ConfiguFile.constructStore({
      type: 'sqlite',
      configuration: { database, tableName: name },
    });
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

  static async constructStore(storeConfig: StoreConfig) {
    debug('ConfiguFile.constructStore', storeConfig);

    // todo: remember to mention in docs that store types cannot be overridden
    if (!ConfigStore.has(storeConfig.type)) {
      debug(`Registering store`, storeConfig);
      const storePackageSubdir = _.chain(storeConfig.type).camelCase().kebabCase().value();
      const storePackageUri = `configu:packages/stores/${storePackageSubdir}${storeConfig.version ? `#${storeConfig.version}` : ''}`;
      await ConfiguModule.registerRemotePackage(storePackageUri);
    }
    return ConfigStore.construct(storeConfig.type, storeConfig.configuration);
  }
}
