import _ from 'lodash';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
// https://npmtrends.com/@apideck/better-ajv-errors-vs-@readme/better-ajv-errors-vs-@segment/ajv-human-errors-vs-@stoplight/better-ajv-errors-vs-ajv-error-messages-vs-ajv-errors-vs-better-ajv-errors
import { AggregateAjvError } from '@segment/ajv-human-errors';
import type { FromSchema, JSONSchema as JSONSchemaObject } from 'json-schema-to-ts';

export { JSONSchemaObject, FromSchema };

export class JSONSchema {
  private static ajv = addFormats(
    new Ajv({ allErrors: true, verbose: true, allowUnionTypes: true, useDefaults: 'empty' }),
  );

  static validate(schema: JSONSchemaObject, data: unknown) {
    const isValid = JSONSchema.ajv.validate(schema, data);
    if (!isValid) {
      const errors = new AggregateAjvError(JSONSchema.ajv.errors as ErrorObject[]);
      throw new Error(errors.message);
    }
  }

  static AnyPropertySchema = {
    type: ['string', 'number', 'boolean', 'object', 'array'],
    oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'object' }, { type: 'array' }],
  } as const satisfies JSONSchemaObject;

  static AnyArrayPropertySchema = {
    type: 'array',
    uniqueItems: true,
    items: JSONSchema.AnyPropertySchema,
  } as const satisfies JSONSchemaObject;

  static createPropertyExclusiveSchema({
    property,
    exclusive,
  }: {
    property: string;
    exclusive: string[];
  }): JSONSchemaObject {
    return {
      if: {
        required: [property],
      },
      then: {
        properties: {
          ..._.chain(exclusive)
            .keyBy()
            .mapValues(() => false)
            .value(),
        },
      },
    };
  }
}
