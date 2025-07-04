import { ConfigCommand } from '../ConfigCommand';
import { EvalCommandOutput } from './EvalCommand';
import { ConfigKey } from '../ConfigKey';
import { ConfigValue, ConfigValueAny } from '../ConfigValue';
import { _ } from '../expressions';

export type ExportCommandOutput = {
  [key: string]: ConfigValueAny;
};

export type ExportCommandInput = {
  pipe: EvalCommandOutput;
  coerce?: boolean;
};

export class ExportCommand extends ConfigCommand<ExportCommandInput, ExportCommandOutput> {
  async execute() {
    const { pipe } = this.input;

    const filteredPipe = _.pickBy(pipe, (config) => !config.cfgu?.hidden);
    this.validatePipe(filteredPipe);
    const mappedPipe = this.kv(filteredPipe);

    return mappedPipe;
  }

  protected validatePipe(pipe: EvalCommandOutput): void {
    _.chain(pipe)
      .values()
      .forEach((current) => {
        ConfigKey.validate({ key: current.key });
      });
  }

  protected kv(pipe: EvalCommandOutput) {
    const { coerce = true } = this.input;

    if (!coerce) {
      return _.chain(pipe).keyBy('key').mapValues('value').value();
    }

    return _.chain(pipe)
      .keyBy('key')
      .mapValues(({ value }) => ConfigValue.parse(value))
      .value();
  }
}
