import _ from 'lodash';
import { Command, EvalCommand, EvalCommandParameters } from '@configu/ts';

type ExportCommandParameters = EvalCommandParameters & {
  override?: boolean;
};

export class ExportCommand extends Command<void> {
  constructor(public parameters: ExportCommandParameters) {
    super(parameters);
  }

  async run() {
    const { override = true, ...evalParameters } = this.parameters;
    const { result: evaluatedConfigs } = await new EvalCommand(evalParameters).run();

    // * https://github.com/motdotla/dotenv/blob/master/lib/main.js#L74
    _(evaluatedConfigs)
      .entries()
      .forEach(([key, val]) => {
        if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
          process.env[key] = val;
        } else if (override === true) {
          process.env[key] = val;
        }
      });
  }
}
