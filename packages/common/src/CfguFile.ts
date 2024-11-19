import { basename } from 'pathe';
import { ConfigSchema, ConfigSchemaKeysSchema, JSONSchema, JSONSchemaObject, FromSchema } from '@configu/sdk';
import { readFile, parseJSON, parseYAML } from './utils';

// interface CfguFileContents {
//   $schema?: string;
//   // todo: implement extends for .cfgu files
//   // extends?: string;
//   keys: ConfigSchemaKeys;
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
// } as const;

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
      // default: CfguFileSchemaId,
      // nullable: true,
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

  static async search(): Promise<CfguFile> {
    // todo: implement search of one or multi .cfgu file here
    throw new Error('Not implemented');
  }

  constructSchema(): ConfigSchema {
    return new ConfigSchema(this.contents.keys);
  }

  // getSchemaInstance(path: string): ConfigSchema {
}
