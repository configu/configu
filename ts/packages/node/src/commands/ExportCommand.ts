import _ from 'lodash';
import {
  ExportCommand as BaseExportCommand,
  type ExportCommandParameters as BaseExportCommandParameters,
} from '@configu/ts';

export type { ExportCommandReturn } from '@configu/ts';

export type ExportCommandParameters = BaseExportCommandParameters & {
  env?: boolean;
  override?: boolean;
};

export class ExportCommand extends BaseExportCommand {
  constructor(public parameters: ExportCommandParameters) {
    super(parameters);
  }

  async run() {
    const { env = true, override = true } = this.parameters;
    const exportedConfigs = await super.run();

    if (env) {
      // * https://github.com/motdotla/dotenv/blob/master/lib/main.js#L74
      _(exportedConfigs)
        .entries()
        .forEach(([key, val]) => {
          if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
            process.env[key] = val;
          } else if (override === true) {
            process.env[key] = val;
          }
        });
    }

    return exportedConfigs;
  }
}
