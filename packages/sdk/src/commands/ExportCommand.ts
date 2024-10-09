import _ from 'lodash';
import { ConfigCommand } from './ConfigCommand';
import { EvalCommandOutput, EvaluatedConfig } from './EvalCommand';
import { Json, Naming } from '../utils';

export type ExportCommandOutput = string;

type ExportCommandFilter = (config: EvaluatedConfig) => boolean;
type ExportCommandMapper = (config: EvaluatedConfig) => EvaluatedConfig;
type ExportCommandReducer = (configs: EvaluatedConfig[]) => string;

export type ExportCommandInput = {
  pipe: EvalCommandOutput;
  filter?: (config: EvaluatedConfig) => boolean;
  map?: (config: EvaluatedConfig) => EvaluatedConfig;
  reduce?: (configs: EvaluatedConfig[]) => string;
};

export class ExportCommand extends ConfigCommand<ExportCommandInput, ExportCommandOutput> {
  async execute() {
    const { pipe } = this.input;
    const filteredPipe = this.filter(pipe);
    const mappedPipe = this.map(filteredPipe);
    const reducedPipe = this.reduce(mappedPipe);
    return reducedPipe;
  }

  static filterHidden: ExportCommandFilter = (config) => {
    return !config.cfgu.hidden;
  };

  static validateKey: ExportCommandMapper = (config) => {
    if (!Naming.validate(config.key)) {
      throw new Error(`ConfigKey "${config.key}" ${Naming.errorMessage}`);
    }
    return config;
  };

  static formatJson: ExportCommandReducer = (configs) => {
    return Json.stringify({ data: _.chain(configs).keyBy('key').mapValues('value').value(), beautify: true });
  };

  private filter(pipe: EvalCommandOutput) {
    const { filter = ExportCommand.filterHidden } = this.input;
    return _.pickBy(pipe, filter);
  }

  private map(pipe: EvalCommandOutput) {
    const { map } = this.input;
    const mapAndValidate: ExportCommandMapper = (config) => {
      const mappedConfig = map?.(config) ?? config;
      return ExportCommand.validateKey(mappedConfig);
    };
    return _.mapValues(pipe, mapAndValidate);
  }

  private reduce(pipe: EvalCommandOutput) {
    const { reduce = ExportCommand.formatJson } = this.input;

    const reducerInput = _.chain(pipe)
      .mapValues((current, key) => ({
        ...current,
        originalKey: key,
      }))
      .values()
      .value();

    return reduce(reducerInput);
  }
}
