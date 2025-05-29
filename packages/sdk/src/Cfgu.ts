import { type ExpressionString } from './ConfigExpression';
import { JSONSchema, JSONSchemaObject, FromSchema } from './expressions/JSONSchema';

// todo: migrate descriptions to new Cfgu type
/**
 * A generic declaration of a `Config`, using constraints and metadata.
 * @see {@link https://configu.com/docs/cfgu/}
 */
export interface ICfgu {
  /**
   * @default ''
   * @usage export - display
   * A human-readable description of a `Config`.
   * @example `The number of items to display per page.`
   */
  description?: string;

  /**
   * @default []
   * @usage export - filter | group | sort | display
   * A human-readable label of a `Config`.
   */
  label?: string | string[];

  /**
   * @default false
   * @usage export - filter
   */
  hidden?: boolean;

  /**
   * @default false
   * @usage upsert - validate, eval - override
   * @exclusive const, default
   */
  lazy?: boolean;

  /**
   * @default undefined
   * @replaces template
   * @usage upsert - validate, eval - const
   * @exclusive lazy, default, required
   * @resolves string
   */
  const?: ExpressionString;

  /**
   * @default undefined
   * @usage eval - default
   * @exclusive lazy, const, required
   */
  default?: any;

  // todo: add ticket to support expression in required
  /**
   * @default false
   * @usage eval - validate
   * @exclusive const, default
   */
  required?: boolean; // | ExpressionString;

  // todo: add ticket to remake the depends property
  // depends: ExpressionString | ExpressionString[];

  // todo:? add ticket for type cfgu property
  // /**
  //  * @default 'string'
  //  * @usage upsert - validate, eval - parse & validate, export - parse
  //  * @exclusive
  //  */
  // type?: CfguType;

  /**
   * @default undefined
   * @usage upsert - validate, eval - validate
   */
  pattern?: string;

  /**
   * @default undefined
   * @replaces options
   * @usage upsert - validate, eval - validate
   */
  enum?: any[];

  /**
   * @default undefined
   * @usage upsert - validate, eval - validate
   */
  schema?: JSONSchemaObject;

  /**
   * @default undefined
   * @usage upsert - validate, eval - validate
   * Use this property to validate a `ConfigValue`.
   * This property receives a string or an array of strings representing an expression that evaluates to a boolean.
   * If an array is provided, all expressions must evaluate to `true` for the value to be considered valid.
   * @example `isEmail` or `['isNumeric', 'isDivisibleBy(10)']`
   * @resolves boolean
   */
  test?: ExpressionString | ExpressionString[];
}

// build-time validation
const CfguStringProperty = {
  type: 'string',
  minLength: 1,
} as const satisfies JSONSchemaObject;
const CfguBooleanProperty = {
  type: 'boolean',
} as const satisfies JSONSchemaObject;
const CfguStringOrBooleanProperty = {
  type: ['string', 'boolean'],
  oneOf: [CfguStringProperty, CfguBooleanProperty],
};
const CfguObjectProperty = {
  type: 'object',
  minProperties: 1,
} as const satisfies JSONSchemaObject;
const CfguStringArrayProperty = {
  type: 'array',
  minItems: 1,
  uniqueItems: true,
  items: CfguStringProperty,
} as const satisfies JSONSchemaObject;
const CfguStringOrStringArrayProperty = {
  type: ['string', 'array'],
  oneOf: [CfguStringProperty, CfguStringArrayProperty],
} as const satisfies JSONSchemaObject;

export const CfguSchema = {
  type: 'object',
  required: [],
  additionalProperties: false,
  nullable: true,
  properties: {
    description: CfguStringProperty,
    label: CfguStringOrStringArrayProperty,
    hidden: CfguBooleanProperty,
    lazy: CfguBooleanProperty,
    const: CfguStringProperty,
    default: JSONSchema.AnyPropertySchema,
    required: CfguBooleanProperty,
    pattern: CfguStringProperty,
    enum: JSONSchema.AnyArrayPropertySchema,
    schema: CfguObjectProperty,
    test: CfguStringOrStringArrayProperty,
  },
  allOf: [
    JSONSchema.createPropertyExclusiveSchema({
      property: 'lazy',
      exclusive: ['const', 'default'],
    }),
    JSONSchema.createPropertyExclusiveSchema({
      property: 'const',
      // todo: consider if its a stupid but valid pair with required
      exclusive: ['lazy', 'default'],
      // exclusive: ['lazy', 'default', 'required'],
    }),
    JSONSchema.createPropertyExclusiveSchema({
      property: 'default',
      exclusive: ['lazy', 'const', 'required'],
    }),
    JSONSchema.createPropertyExclusiveSchema({
      property: 'required',
      exclusive: ['const', 'default'],
    }),
  ],
} as const satisfies JSONSchemaObject;

export type Cfgu = FromSchema<typeof CfguSchema>;
