import fs from 'node:fs/promises';
import {
  ConfigSchema,
  ConfigSchemaKeys,
  V0ConfigSchemaKeys,
  ConfigSchemaKeysSchema,
  _,
  JSONSchema,
  JSONSchemaObject,
  FromSchema,
} from '@configu/sdk';
import {
  debug,
  path as pathe,
  readFile,
  glob,
  parseJsonFile,
  parseYamlFile,
  YAML,
  normalizeInput,
  configuFilesApi,
  AllowedExtensions,
  AllowedExtension,
} from './utils';

const { basename, dirname, resolve } = pathe;

// https://raw.githubusercontent.com/configu/configu/main/packages/schema/.cfgu.json
const CfguFileSchemaId = `${configuFilesApi.defaults.baseURL}/schema/.cfgu.json`;

const CfguFileSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: CfguFileSchemaId,
  $comment: 'https://jsonschema.dev/s/sZY8z',
  title: 'JSON Schema for Configu .cfgu files',
  description: 'https://docs.configu.com/interfaces/.cfgu',
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    $schema: {
      type: 'string',
      minLength: 1,
      description: 'Url to JSON Schema',
    },
    keys: ConfigSchemaKeysSchema,
  },
} as const satisfies JSONSchemaObject;

export type CfguFileContents = FromSchema<typeof CfguFileSchema>;

export class CfguFile {
  public static readonly schema = CfguFileSchema;
  public static readonly neighborsGlob = `*.cfgu.{${AllowedExtensions.join(',')}}`;

  public readonly dir: string;
  constructor(
    public readonly path: string,
    public readonly contents: CfguFileContents,
    public readonly contentsType: Exclude<AllowedExtension, 'yml'>,
  ) {
    debug('CfguFile.constructor', { path, contents, contentsType });
    try {
      this.dir = dirname(resolve(this.path));
      JSONSchema.validate(CfguFile.schema, this.contents);
    } catch (error) {
      throw new Error(`CfguFile.contents "${path}" is invalid\n${error.message}`);
    }
  }

  private static async init(path: string, contents: string, fileExt: string): Promise<CfguFile> {
    debug('CfguFile.init', { path, contents, fileExt });

    let parsedContents: CfguFileContents | V0ConfigSchemaKeys = {};
    let contentsType: typeof CfguFile.prototype.contentsType;
    if (fileExt === 'yaml' || fileExt === 'yml') {
      parsedContents = parseYamlFile(path, contents);
      contentsType = 'yaml';
    } else if (fileExt === 'json') {
      parsedContents = parseJsonFile(path, contents);
      contentsType = 'json';
    } else {
      throw new Error(`CfguFile.path "${path}" is not a valid .cfgu file`);
    }

    if (!parsedContents.keys) {
      const legacySchema = ConfigSchema.fromLegacyConfigSchema(parsedContents);
      parsedContents = { $schema: CfguFileSchemaId, keys: legacySchema.keys };
    }

    // todo: add support for extends keyword
    return new CfguFile(path, parsedContents, contentsType);
  }

  public static getPathInfo(path: string) {
    const fileName = basename(path);
    const [cfguName, cfguExt, fileExt] = fileName.split('.');
    if (cfguExt !== 'cfgu' || !fileExt || !AllowedExtensions.includes(fileExt as AllowedExtension)) {
      throw new Error(`CfguFile.path "${path}" is not a valid .cfgu file`);
    }
    const depth = path.split(pathe.sep).length;
    return { path, depth, fileName, cfguName, fileExt };
  }

  public static async load(path: string): Promise<CfguFile> {
    debug('CfguFile.load', { path });

    const { fileExt } = CfguFile.getPathInfo(path);

    let contents: string;
    try {
      contents = await readFile(path);
    } catch (error) {
      throw new Error(`CfguFile.path "${path} is not readable\n${error.message}`);
    }

    return CfguFile.init(path, contents, fileExt);
  }

  public static sortPaths(paths: string[]): string[] {
    return _.chain(paths).map(CfguFile.getPathInfo).orderBy(['depth', 'cfguName'], ['desc', 'asc']).map('path').value();
  }

  public static async searchGlob(path: string) {
    // todo: try to replace glob lib with the native fs.glob api
    return glob(path, { nodir: true, dot: true });
  }

  public async save(contents: CfguFileContents) {
    const mergedContents = _.merge({}, this.contents, contents) satisfies CfguFileContents;
    let renderedContents: string;
    if (this.contentsType === 'json') {
      renderedContents = JSON.stringify(mergedContents, null, 2);
    } else {
      renderedContents = YAML.stringify(mergedContents);
    }
    await fs.writeFile(this.path, renderedContents);
    return CfguFile.load(this.path);
  }

  public getSchemaInstance(): ConfigSchema {
    return new ConfigSchema(this.contents.keys);
  }

  public static async constructSchema(input: string) {
    // input is a path file://url json or glob string
    debug('CfguFile.constructSchema', { input });
    const { type, path } = normalizeInput(input, '.cfgu');
    if (type === 'json') {
      const cfguFile = await CfguFile.init('.cfgu.json', input, 'json');
      return cfguFile.getSchemaInstance();
    }
    if (type === 'file') {
      const cfguFile = await CfguFile.load(path);
      return cfguFile.getSchemaInstance();
    }
    if (type === 'glob') {
      const paths = await CfguFile.searchGlob(path);
      if (paths.length === 0) {
        throw new Error(`No .cfgu files found in "${input}"`);
      }
      const sortedPaths = CfguFile.sortPaths(paths);
      const configSchemasPromises = sortedPaths.map(async (p) => {
        const cfgu = await CfguFile.load(p);
        return cfgu.getSchemaInstance();
      });
      const configSchemas = await Promise.all(configSchemasPromises);
      return new ConfigSchema(_.merge({}, ...configSchemas.map((schema) => schema.keys)));
    }
    // todo: support http based urls
    // code below is unreachable
    throw new Error('.cfgu file input is not a valid file path, glob, or JSON string');
  }
}
