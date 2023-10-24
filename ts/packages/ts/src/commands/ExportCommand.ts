import _ from 'lodash';
import { Command } from '../Command';
import { type EvalCommandReturn } from './EvalCommand';

export type ExportCommandReturn = {
  [key: string]: string;
};

export type ExportCommandParameters = {
  data: EvalCommandReturn;
};

export class ExportCommand extends Command<ExportCommandReturn> {
  constructor(public parameters: ExportCommandParameters) {
    super(parameters);
  }

  async run() {
    const { data } = this.parameters;
    return _.mapValues(data, (current) => current.result.value);
  }
}
