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
  filter?: ({ context, result }: EvalCommandReturn['string']) => boolean;
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
      const mutatedKey = String(keys(key));
      if (!NAME(mutatedKey)) {
        throw new ConfigError('invalid config key', `key "${key}" mustn't contain reserved words`, errorScope);
      }
      return mutatedKey;
    });
  }

  private filterPipe(pipe: EvalCommandReturn) {
    const { filter } = this.parameters;
    if (!filter) {
      return _.pickBy(pipe, ({ context }) => !context.cfgu.hidden);
    }
    return _.pickBy(pipe, filter);
  }

  async run() {
    const { pipe } = this.parameters;
    const filteredPipe = this.filterPipe(pipe);
    const configDict = _.mapValues(filteredPipe, (current) => current.result.value);
    const keyMutatedConfigDict = this.mutateKeys(configDict);
    return keyMutatedConfigDict;
  }
}
