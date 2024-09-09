import Ajv, { SchemaObject } from 'ajv';
// https://npmtrends.com/@apideck/better-ajv-errors-vs-@readme/better-ajv-errors-vs-@segment/ajv-human-errors-vs-@stoplight/better-ajv-errors-vs-ajv-error-messages-vs-ajv-errors-vs-better-ajv-errors
import { betterAjvErrors } from '@apideck/better-ajv-errors';

const ajv = new Ajv({ allErrors: true });

export class JSONSchema {
  static validate({ schema, data }: { schema: SchemaObject; data: unknown }) {
    const valid = ajv.validate(schema, data);
    if (!valid) {
      const errors = betterAjvErrors({ schema, data, errors: ajv.errors });
    }
    return valid;
  }
}
