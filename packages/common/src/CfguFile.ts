import { readFile } from 'node:fs/promises';
import { basename } from 'pathe';
import { ConfigSchema, ConfigSchemaKeys, ConfigSchemaKeysSchema, JsonSchema, JsonSchemaType } from '@configu/sdk';
import { parseJSON, parseYAML } from './utils';

export interface CfguFileContents {
  $schema?: string;
  // extends?: string;
  keys: ConfigSchemaKeys;
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
} as const;

const CfguFileSchemaId = 'https://raw.githubusercontent.com/configu/configu/main/packages/schema/.cfgu.json';

export const CfguFileSchema: JsonSchemaType<CfguFileContents> = {
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
      default: CfguFileSchemaId,
      nullable: true,
    },

    keys: ConfigSchemaKeysSchema,
  },
};

export class CfguFile {
  constructor(
    public readonly path: string,
    public readonly contents: CfguFileContents,
  ) {
    if (!JsonSchema.validate({ schema: CfguFileSchema, path, data: this.contents })) {
      throw new Error(`CfguFile.contents "${path}" is invalid\n${JsonSchema.getLastValidationError()}`);
    }
  }

  static allowedExtensions = ['json', 'yaml', 'yml'];

  private static async init(path: string, contents: string): Promise<CfguFile> {
    const [, cfguExt, fileExt] = basename(path).split('.');

    if (cfguExt !== 'cfgu' || !fileExt || !CfguFile.allowedExtensions.includes(fileExt)) {
      throw new Error(`CfguFile.path "${path}" is not a valid .cfgu file`);
    }

    let parsedContents: CfguFileContents = { keys: {} };

    if (fileExt === 'yaml' || fileExt === 'yml') {
      parsedContents = parseYAML(path, contents);
    } else if (fileExt === 'json') {
      parsedContents = parseJSON(path, contents);
    }

    return new CfguFile(path, parsedContents);
  }

  static async load(path: string): Promise<CfguFile> {
    const contents = await readFile(path, { encoding: 'utf8' });
    return CfguFile.init(path, contents);
  }

  static async search(): Promise<CfguFile> {
    // todo: implement search of one or multi .cfgu file here
    throw new Error('Not implemented');
  }

  constructSchema(): ConfigSchema {
    return new ConfigSchema(this.contents.keys);
  }
}
