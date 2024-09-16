import { EvalCommand as BaseEvalCommand, type EvalCommandParameters as BaseEvalCommandParameters } from '@configu/ts';

export type EvalCommandParameters = BaseEvalCommandParameters & {
  override?: boolean;
};

export class EvalCommand extends BaseEvalCommand {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  async run() {
    const res = await super.run();
    // TODO: Extract caching logic from CLI
    return res;
  }
}
