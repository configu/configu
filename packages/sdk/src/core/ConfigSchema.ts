import _ from 'lodash';
import { Cfgu, CfguSchema } from './Cfgu';
import { Naming, JsonSchemaType } from '../utils';

export type ConfigSchemaKeys = { [ConfigKey: string]: Cfgu };

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
        if (!Naming.validate(key)) {
          throw new Error(`ConfigSchema.keys "${key}" ${Naming.errorMessage}`);
        }

        // if (!JsonSchema.validate({ schema: CfguSchema, data: cfgu })) {
        //   throw new Error(`ConfigSchema.keys "${key}" is invalid\n${JsonSchema.getLastValidationError()}`);
        // }
      });
  }
}

export const ConfigSchemaKeysSchema: JsonSchemaType<ConfigSchemaKeys> = {
  type: 'object',
  required: [],
  // additionalProperties: false,
  minProperties: 1,
  // patternProperties: {
  //   [Naming.pattern]: CfguSchema,
  // },
  additionalProperties: CfguSchema,
};
