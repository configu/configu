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

  private mutateKeys(result: EvalCommandReturn): EvalCommandReturn {
    const { keys } = this.parameters;

    if (!keys) {
      return result;
    }

    return _.mapKeys(result, (current, key) => {
      const errorScope: [string, string][] = [
        ['ExportCommand', ''],
        ['ConfigKey', key],
      ];
      try {
        const mutatedKey = keys(key);
        if (!NAME(mutatedKey)) {
          throw new Error(`key "${mutatedKey}" mustn't contain reserved words`);
        }
        return mutatedKey;
      } catch (error) {
        throw new ConfigError('invalid config key', error.message, errorScope);
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
