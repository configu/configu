import _ from 'lodash';
import { Cfgu, CfguSchema } from './Cfgu';
import { Naming } from '../utils/String';
import { JsonSchema } from '../utils/Json';

/**
 * A file containing binding records linking each unique `ConfigKey` to its corresponding `Cfgu` declaration.
 * https://configu.com/docs/config-schema/
 */
export class ConfigSchema {
  constructor(public readonly keys: { [ConfigKey: string]: Cfgu }) {
    if (!this.keys || _.isEmpty(this.keys)) {
      throw new Error('ConfigSchema.contents is required');
    }

    _(this.keys)
      .entries()
      .forEach(([key, cfgu]) => {
        if (!Naming.validate(key)) {
          throw new Error(`ConfigSchema.keys "${key}" ${Naming.errorMessage}`);
        }

        if (!JsonSchema.validate({ schema: CfguSchema, data: cfgu })) {
          throw new Error(`ConfigSchema.keys "${key}" is invalid\n${JsonSchema.getLastValidationError()}`);
        }
      });
  }
}
