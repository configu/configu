import { SchemaObject, JSONSchemaType } from 'ajv';

export type JsonSchemaType<T> = JSONSchemaType<T>;
export type JsonSchemaObject = SchemaObject;

export const NamingPattern = '^[A-Za-z0-9_-]+$';

export const CfguTypes = [
  // primitives
  'Boolean',
  'Number',
  'String',
  // patterns
  'RegEx',
  'UUID',
  'SemVer',
  'IPv4',
  'IPv6',
  'Domain',
  'URL',
  'ConnectionString',
  'Hex',
  'Base64',
  'MD5',
  'SHA',
  'Color',
  'Email',
  'MobilePhone',
  'Locale',
  'LatLong',
  'Country',
  'Currency',
  'DockerImage',
  'MACAddress',
  'MIMEType',
  'MongoId',
  'AWSRegion',
  'AZRegion',
  'GCPRegion',
  'OracleRegion',
  'IBMRegion',
  'AlibabaRegion',
  'Language',
  'DateTime',
  'ARN',
  // structured
  'JSONSchema',
] as const;
type CfguType = (typeof CfguTypes)[number];

interface Cfgu {
  description?: string;
  type: CfguType;
  pattern?: string;
  schema?: JsonSchemaObject;
  // schema?: JsonSchemaObject | Cfgu;
  options?: string[];
  default?: string;
  required?: boolean;
  depends?: string[];
  template?: string;
  lazy?: boolean;
  hidden?: boolean;
  labels?: string[];
}

export const CfguSchemaDefs = {
  BooleanProperty: {
    type: 'boolean',
    nullable: true,
  },
  StringProperty: {
    type: 'string',
    minLength: 1,
    nullable: true,
  },
  ArrayProperty: {
    type: 'array',
    minItems: 1,
    uniqueItems: true,
    items: {
      type: 'string',
      minLength: 1,
    },
    nullable: true,
  },
  ConfigKey: {
    type: 'string',
    pattern: NamingPattern,
    minLength: 1,
  },
} as const;

export const CfguSchema: JsonSchemaType<Cfgu> = {
  type: 'object',
  required: ['type'],
  additionalProperties: false,
  properties: {
    description: CfguSchemaDefs.StringProperty,
    type: {
      type: 'string',
      enum: CfguTypes,
    },
    pattern: CfguSchemaDefs.StringProperty,
    schema: {
      type: 'object',
      minProperties: 1,
      nullable: true,
    },
    options: CfguSchemaDefs.ArrayProperty,
    default: CfguSchemaDefs.StringProperty,
    required: CfguSchemaDefs.BooleanProperty,
    depends: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: CfguSchemaDefs.ConfigKey,
      nullable: true,
    },
    template: CfguSchemaDefs.StringProperty,
    lazy: CfguSchemaDefs.BooleanProperty,
    hidden: CfguSchemaDefs.BooleanProperty,
    labels: CfguSchemaDefs.ArrayProperty,
  },
  allOf: [
    {
      if: {
        properties: { type: { const: 'RegEx' } },
      },
      then: {
        required: ['pattern'],
        properties: {
          schema: false,
          options: false,
        },
      },
      else: {
        properties: {
          pattern: false,
        },
      },
    },
    {
      if: {
        properties: { type: { const: 'JSONSchema' } },
      },
      then: {
        required: ['schema'],
        properties: {
          pattern: false,
          options: false,
        },
      },
      else: {
        properties: {
          schema: false,
        },
      },
    },
    {
      if: {
        required: ['options'],
      },
      then: {
        properties: {
          template: false,
        },
      },
    },
    {
      if: {
        required: ['default'],
      },
      then: {
        properties: {
          required: false,
          template: false,
          lazy: false,
        },
      },
    },
    {
      if: {
        required: ['template'],
      },
      then: {
        properties: {
          required: false,
          default: false,
          lazy: false,
        },
      },
    },
    {
      if: {
        required: ['lazy'],
      },
      then: {
        properties: {
          default: false,
          template: false,
        },
      },
    },
  ],
};

export type ConfigSchemaContents = { [ConfigKey: string]: Cfgu };

export const ConfigSchemaContents: JsonSchemaType<ConfigSchemaContents> = {
  type: 'object',
  required: [],
  additionalProperties: false,
  minProperties: 1,
  patternProperties: {
    [NamingPattern]: CfguSchema,
  },
};
