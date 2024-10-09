import { ExpressionString, JsonSchema, JsonSchemaObject, JsonSchemaType } from '../utils';

export const CfguType = ['boolean', 'number', 'string', 'object', 'array'] as const;
export type CfguType = (typeof CfguType)[number];

/**
 * A generic declaration of a `Config`, using constraints and metadata.
 * @see {@link https://configu.com/docs/cfgu/}
 */
export interface Cfgu {
  description?: string;
  label?: string | string[];

  hidden?: boolean;
  lazy?: boolean; // exclusive: const, default, template

  const?: ExpressionString; // exclusive: lazy, default, template, required
  default?: string; // exclusive: lazy, const, template, required
  // template?: ExpressionString; // exclusive: lazy, const, default, required

  // todo: add ticket to support expression in required
  // required?: boolean | ExpressionString;
  required?: boolean; // exclusive: const, default, template
  // type?: CfguType;
  enum?: string[];
  pattern?: string;
  schema?: JsonSchemaObject;
  /**
   * Use this property to validate a `ConfigValue`.
   * This property receives a string or an array of strings representing an expression that evaluates to a boolean.
   * If an array is provided, all expressions must evaluate to `true` for the value to be considered valid.
   * @example `isEmail` or `['isNumeric', 'isDivisibleBy(10)']`
   */
  test?: ExpressionString | ExpressionString[];
}

// build-time validation
const CfguPrimitiveDefs = {
  BooleanProperty: {
    type: 'boolean',
    nullable: true,
  },
  StringProperty: {
    type: 'string',
    minLength: 1,
    nullable: true,
  },
  ObjectProperty: {
    type: 'object',
    minProperties: 1,
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
} as const;

const CfguCompoundSchemaDefs = {
  BooleanOrStringProperty: {
    type: ['boolean', 'string'],
    anyOf: [CfguPrimitiveDefs.BooleanProperty, CfguPrimitiveDefs.StringProperty],
    nullable: true,
  },
  StringOrArrayProperty: {
    type: ['string', 'array'],
    anyOf: [CfguPrimitiveDefs.StringProperty, CfguPrimitiveDefs.ArrayProperty],
    nullable: true,
  },
} as const;

export const CfguSchemaDefs = {
  ...CfguPrimitiveDefs,
  ...CfguCompoundSchemaDefs,
} as const;

export const CfguSchema: JsonSchemaType<Cfgu> = {
  type: 'object',
  required: [],
  additionalProperties: false,
  properties: {
    description: CfguSchemaDefs.StringProperty,
    label: CfguSchemaDefs.StringOrArrayProperty,

    hidden: CfguSchemaDefs.BooleanProperty,
    lazy: CfguSchemaDefs.BooleanProperty,

    const: CfguSchemaDefs.StringProperty,
    default: CfguSchemaDefs.StringProperty,
    // template: CfguSchemaDefs.StringProperty,

    required: CfguSchemaDefs.BooleanProperty,
    // type: {
    //   ...CfguSchemaDefs.StringProperty,
    //   enum: CfguType,
    // },
    enum: CfguSchemaDefs.ArrayProperty,
    pattern: CfguSchemaDefs.StringProperty,
    schema: CfguSchemaDefs.ObjectProperty,

    test: CfguSchemaDefs.StringOrArrayProperty,
  },
  allOf: [
    JsonSchema.createPropertyExclusiveSchema({
      property: 'lazy',
      exclusive: ['const', 'default'],
      // exclusive: ['const', 'default', 'template']
    }),
    JsonSchema.createPropertyExclusiveSchema({
      property: 'const',
      exclusive: ['lazy', 'default', 'required'],
      // exclusive: ['lazy', 'default', 'template', 'required'],
    }),
    JsonSchema.createPropertyExclusiveSchema({
      property: 'default',
      exclusive: ['lazy', 'const', 'required'],
      // exclusive: ['lazy', 'const', 'template', 'required'],
    }),
    // JsonSchema.createPropertyExclusiveSchema({
    //   property: 'template',
    //   exclusive: ['lazy', 'const', 'default', 'required'],
    // }),
    JsonSchema.createPropertyExclusiveSchema({
      property: 'required',
      exclusive: ['const', 'default'],
      // exclusive: ['const', 'default', 'template'],
    }),
  ],
};
