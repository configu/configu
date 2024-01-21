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
      try {
        const mutatedKey = keys(key);
        if (!NAME(mutatedKey)) {
          throw new ConfigError('invalid config key', `${mutatedKey} must be a valid name`);
        }
        return mutatedKey;
      } catch (error) {
        return key;
      }
    });
  }

  async run() {
    const { pipe } = this.parameters;
    return _.mapValues(this.mutateKeys(pipe), (current) => current.result.value);
  }
}
