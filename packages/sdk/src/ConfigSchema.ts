import _ from 'lodash';
import { CfguSchema } from './Cfgu';
import { ConfigKey } from './ConfigKey';
import { JSONSchema, JSONSchemaObject, FromSchema } from './expressions/JSONSchema';

// export type ConfigSchemaKeys = { [ConfigKey: string]: Cfgu };

export const ConfigSchemaKeysSchema = {
  type: 'object',
  required: [],
  minProperties: 1,
  // todo: patternProperties is not supported by OpenAPI and has limited error resolution support. Thats why we currently use additionalProperties and check key Naming separately.
  // additionalProperties: false,
  // patternProperties: {
  //   [Naming.pattern]: CfguSchema,
  // },
  additionalProperties: CfguSchema,
} as const satisfies JSONSchemaObject;

export type ConfigSchemaKeys = FromSchema<typeof ConfigSchemaKeysSchema>;

/**
 * A file containing binding records linking each unique `ConfigKey` to its corresponding `Cfgu` declaration.
 * https://configu.com/docs/config-schema/
 */
export class ConfigSchema {
  constructor(public readonly keys: ConfigSchemaKeys = {}) {
    if (_.isEmpty(this.keys)) {
      throw new Error('ConfigSchema.keys is required');
    }

    _.chain(this.keys)
      .entries()
      .forEach(([key, cfgu]) => {
        ConfigKey.validate({ key, errorPrefix: 'ConfigSchema.keys' });
        // if (!JsonSchema.validate({ schema: CfguSchema, data: cfgu })) {
        //   throw new Error(`ConfigSchema.keys "${key}" is invalid\n${JsonSchema.getLastValidationError()}`);
        // }
      });

    try {
      JSONSchema.validate(ConfigSchemaKeysSchema, this.keys);
    } catch (error) {
      throw new Error(`ConfigSchema.keys are invalid\n${error.message}`);
    }
  }
}
