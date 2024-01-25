import _ from 'lodash';
import { Command } from '../Command';
import { type EvalCommandReturn } from './EvalCommand';
import { NAME, ConfigError } from '../utils';

export type ExportCommandReturn = {
  [key: string]: string;
};

export type ExportCommandParameters = {
  pipe: EvalCommandReturn;
  keys?: (key: string) => string;
};

export class ExportCommand extends Command<ExportCommandReturn> {
  constructor(public parameters: ExportCommandParameters) {
    super(parameters);
  }

  private mutateKeys(result: { [key: string]: string }): { [key: string]: string } {
    const { keys } = this.parameters;

    if (!keys) {
      return result;
    }

    return _.mapKeys(result, (current, key) => {
      const errorScope: [string, string][] = [
        ['ExportCommand', ''],
        ['ConfigKey', key],
      ];
      let mutatedKey = '';
      let isKeyValid = true;
      try {
        mutatedKey = String(keys(key));
      } catch (error) {
        isKeyValid = false;
      }
      isKeyValid = isKeyValid && NAME(mutatedKey);
      if (!isKeyValid) {
        throw new ConfigError(
          `key "${mutatedKey}" mutation failed`,
          'check mutation callback returns valid key',
          errorScope,
        );
      }
    });
  }

  async run() {
    const { pipe } = this.parameters;
    const configDict = _.mapValues(pipe, (current) => current.result.value);
    const keyMutatedConfigDict = this.mutateKeys(configDict);
    return keyMutatedConfigDict;
  }
}
