import _ from 'lodash';
import { Cfgu, CfguSchema } from './Cfgu';
// import cfguFileSchema from './.cfgu.json' with { type: 'json' };
import { String } from '../utils/String';
import { JsonSchema, JsonSchemaType } from '../utils/Json';

export type ConfigSchemaContents = { [ConfigKey: string]: Cfgu };

export const ConfigSchemaContents: JsonSchemaType<ConfigSchemaContents> = {
  type: 'object',
  required: [],
  additionalProperties: false,
  minProperties: 1,
  patternProperties: {
    [String.namePattern]: CfguSchema,
  },
};

/**
 * A file containing binding records linking each unique `ConfigKey` to its corresponding `Cfgu` declaration.
 * https://configu.com/docs/config-schema/
 */
export class ConfigSchema {
  constructor(
    public readonly name: string,
    public readonly contents: ConfigSchemaContents,
  ) {
    if (!this.name) {
      throw new Error('ConfigSchema.name is required');
    }

    if (!String.validateNaming(this.name)) {
      throw new Error(`ConfigSchema.name "${this.name}" ${String.namingErrorMessage}`);
    }

    if (!this.contents || _.isEmpty(this.contents)) {
      throw new Error('ConfigSchema.contents is required');
    }

    if (!JsonSchema.validate({ schema: ConfigSchemaContents, data: this.contents })) {
      throw new Error(`ConfigSchema.contents is invalid\n${JsonSchema.getLastValidationError()}`);
    }
  }
}
