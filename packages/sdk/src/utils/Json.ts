import _ from 'lodash';
// import parseJson from 'parse-json'; // todo: find a way to require esm module in cjs builds
import Ajv, { SchemaObject, JSONSchemaType } from 'ajv';
// https://npmtrends.com/@apideck/better-ajv-errors-vs-@readme/better-ajv-errors-vs-@segment/ajv-human-errors-vs-@stoplight/better-ajv-errors-vs-ajv-error-messages-vs-ajv-errors-vs-better-ajv-errors
import { betterAjvErrors, ValidationError } from '@apideck/better-ajv-errors';

export class Json {
  static parse(string: string): unknown {
    return JSON.parse(string);
    // return parseJson(string);
  }

  static stringify({ data, beautify = false }: { data: unknown; beautify?: boolean }) {
    return JSON.stringify(data, null, beautify ? 2 : undefined);
  }
}

export type JsonSchemaType<T> = JSONSchemaType<T>;
export type JsonSchemaObject = SchemaObject;

export class JsonSchema {
  private static ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  private static lastValidationError: ValidationError[] = [];
  static validate({ schema, path, data }: { schema: SchemaObject; path?: string; data: unknown }) {
    const valid = JsonSchema.ajv.validate(schema, data);
    if (!valid) {
      JsonSchema.lastValidationError = betterAjvErrors({ schema, data, errors: JsonSchema.ajv.errors, basePath: path });
    }
    return valid;
  }

  static getLastValidationError(as: 'string' | 'object' = 'string') {
    if (as === 'string') {
      return Json.stringify({ data: JsonSchema.lastValidationError, beautify: true });
    }
    return JsonSchema.lastValidationError;
  }

  static createPropertyExclusiveSchema({
    property,
    exclusive,
  }: {
    property: string;
    exclusive: string[];
  }): JsonSchemaObject {
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
