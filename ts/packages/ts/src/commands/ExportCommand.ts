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

  private mapPipe(pipe: EvalCommandReturn) {
    return _.mapValues(pipe, (current) => current.result.value);
  }

  async run() {
    const { pipe } = this.parameters;
    const filteredPipe = this.filterPipe(pipe);
    const mappedPipe = this.mapPipe(filteredPipe);
    const keyMutatedMappedPipe = this.mutateKeys(mappedPipe);
    return keyMutatedMappedPipe;
  }
}
