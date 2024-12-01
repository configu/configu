import { cwd } from 'node:process';
import { fileURLToPath } from 'node:url';
import { join, basename, resolve } from 'pathe';
import { _, JSONSchema, JSONSchemaObject, FromSchema } from '@configu/sdk/expressions';
import { ConfigSchema, ConfigSchemaKeysSchema } from '@configu/sdk';
import { readFile, glob, parseJSON, parseYAML } from './utils';

const CfguFileSchemaId = 'https://raw.githubusercontent.com/configu/configu/main/packages/schema/.cfgu.json';

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

  constructor(
    public readonly path: string,
    public readonly contents: CfguFileContents,
    public readonly contentsType: 'json' | 'yaml',
  ) {
    try {
      JSONSchema.validate(CfguFile.schema, this.contents);
    } catch (error) {
      throw new Error(`CfguFile.contents "${path}" is invalid\n${error.message}`);
    }
  }

  static allowedExtensions = ['json', 'yaml', 'yml'];

  private static async init(path: string, contents: string, fileExt: string): Promise<CfguFile> {
    let parsedContents: CfguFileContents = {};
    let contentsType: 'json' | 'yaml';

    if (fileExt === 'yaml' || fileExt === 'yml') {
      parsedContents = parseYAML(path, contents);
      contentsType = 'yaml';
    } else if (fileExt === 'json') {
      parsedContents = parseJSON(path, contents);
      contentsType = 'json';
    } else {
      throw new Error(`CfguFile.path "${path}" is not a valid .cfgu file`);
    }

    // todo: add support for extends keyword

    return new CfguFile(path, parsedContents, contentsType);
  }

  static async load(path: string): Promise<CfguFile> {
    const [, cfguExt, fileExt] = basename(path).split('.');

    if (cfguExt !== 'cfgu' || !fileExt || !CfguFile.allowedExtensions.includes(fileExt)) {
      throw new Error(`CfguFile.path "${path}" is not a valid .cfgu file`);
    }

    let contents: string;
    try {
      contents = await readFile(path);
    } catch (error) {
      throw new Error(`CfguFile.path "${path} is not readable\n${error.message}`);
    }

    return CfguFile.init(path, contents, fileExt);
  }

  static async loadFromInput(input: string) {
    let url: URL | undefined;
    try {
      url = new URL(input);
    } catch {
      // Not a valid URL
    }
    if (url) {
      if (url.protocol === 'file:') {
        return CfguFile.load(fileURLToPath(url));
      }
      // todo: support http based urls
      throw new Error('Only file URLs are supported');
    }

    try {
      const path = resolve(input);
      return CfguFile.load(path);
    } catch {
      // Not a valid path
    }

    try {
      const json = JSON.parse(input);
      return CfguFile.init(join(cwd(), '.cfgu.json'), json, 'json');
    } catch {
      // Not a valid JSON
    }

    throw new Error('.configu file input is not a valid path, URL, or JSON');
  }

  static async searchNeighbors() {
    return glob(`*.cfgu.{${CfguFile.allowedExtensions.join(',')}}`, { nodir: true });
  }

  static async searchAll(path: string) {
    return glob(path, { nodir: true });
  }

  getSchemaInstance(): ConfigSchema {
    return new ConfigSchema(this.contents.keys);
  }

  private static mergeSchemas(...schemas: ConfigSchema[]): ConfigSchema {
    return new ConfigSchema(_.merge({}, ...schemas.map((schema) => schema.keys)));
  }

  static async constructSchema(...paths: string[]): Promise<ConfigSchema> {
    // // todo: try to replace glob lib with the native fs.glob api
    // const cfguFiles = await glob(path, { nodir: true });
    // if (cfguFiles.length === 0) {
    //   throw new Error(`No .cfgu files found in "${path}"`);
    // }

    // Later schemas take precedence in case of key duplication.
    const sortedPaths = paths.sort((a, b) => a.split('/').length - b.split('/').length);
    const configSchemasPromises = sortedPaths.map(async (path) => {
      const cfgu = await CfguFile.loadFromInput(path);
      return cfgu.getSchemaInstance();
    });
    const configSchemas = await Promise.all(configSchemasPromises);
    return CfguFile.mergeSchemas(...configSchemas);
  }
}
