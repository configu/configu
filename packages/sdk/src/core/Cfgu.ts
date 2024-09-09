import _ from 'lodash';
import validator from 'validator';
import { Json, JsonSchema, JsonSchemaObject, JsonSchemaType } from '../utils/Json';
import { String } from '../utils/String';

export const ConfigValueFormat = ['String', 'Boolean', 'Number'] as const;
export type ConfigValueFormat = (typeof ConfigValueFormat)[number];

/**
 * A generic declaration of a `Config`, using properties like type, description and constraints.
 * @see {@link https://configu.com/docs/cfgu/}
 */
export interface Cfgu {
  /**
   * The value of this keyword is a predefined string format.
   * The data is valid if it is conform to the format defined for this keyword.
   */
  format?: ConfigValueFormat;
  /**
   * @alias format
   */
  type?: ConfigValueFormat;

  /**
   * The value of the keyword should be an array of unique items of type string.
   * The data is valid if it is equal to one of items in the array.
   */
  enum?: string[];
  /**
   * @alias enum
   */
  options?: string[];

  pattern?: string;
  schema?: JsonSchemaObject;

  // process
  default?: string;
  required?: boolean;
  depends?: string[];
  template?: string;
  lazy?: boolean;
  hidden?: boolean;

  // describe
  description?: string;
  labels?: string[];
}

// build-time validation
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
    pattern: String.namePattern,
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

// runtime-time validation
export type CfguValidatorParameters = Cfgu & { value: string };
export type CfguValidatorFunction = (parameters: CfguValidatorParameters) => boolean;

export class CfguValidator {
  private static typeValidators: Record<CfguType, CfguValidatorFunction> = {
    Boolean: ({ value }) => validator.isBoolean(value, { loose: true }),
    Number: ({ value }) => validator.isNumeric(value),
    String: ({ value, pattern }) => {
      if (!pattern) {
        return true;
      }
      return String.createRegExp(pattern).test(value);
    },
    RegEx({ value, pattern }): boolean {
      if (!pattern) {
        return false;
      }
      return String.createRegExp(pattern).test(value);
    },
    JSONSchema: ({ value, schema }) => {
      if (!schema) {
        return false;
      }
      if (['object', 'array'].includes(schema.type)) {
        return JsonSchema.validate({ schema, path: 'Cfgu', data: Json.parse(value) });
      }
      return JsonSchema.validate({ schema, path: 'Cfgu', data: value });
    },
  };

  static validateType(parameters: CfguValidatorParameters) {
    const { type, value } = parameters;

    if (!type) {
      throw new Error('Cfgu.type is required');
    }

    const validate = CfguValidator.typeValidators[type];
    if (!validate) {
      throw new Error(
        `Cfgu.type "${type}" is not yet supported. For the time being, please utilize the "String" type. We'd greatly appreciate it if you could open an issue regarding this at https://github.com/configu/configu/issues/new/choose so we can address it in future updates.`,
      );
    }

    const isValid = validate(parameters);
    if (isValid) {
      return;
    }

    let errorMessage = `ConfigValue "${value}" must be of type "${type}"`;
    if (type === 'RegEx') {
      const { pattern } = parameters;
      errorMessage = `ConfigValue "${value}" must match the pattern "${pattern}"`;
    } else if (type === 'JSONSchema') {
      const { schema } = parameters;
      errorMessage = `ConfigValue "${value}" must match the schema "${Json.stringify({ data: schema, beautify: true })}"`;
    }

    throw new Error(errorMessage);
  }

  static validateOptions(parameters: CfguValidatorParameters) {
    const { options, value } = parameters;

    if (!options || _.isEmpty(options)) {
      return;
    }

    if (!options.includes(value)) {
      throw new Error(
        `ConfigValue "${value}" must be one of the following options: ${_.map(options, (option) => `"${option}"`).join(',')}`,
      );
    }
  }
}
