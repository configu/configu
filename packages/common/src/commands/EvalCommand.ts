import {
  EvalCommand as BaseEvalCommand,
  ConfigStore,
  ConfigStoreError,
  EvalCommandReturn,
  EvaluatedConfigOrigin,
  UpsertCommand,
  type EvalCommandParameters as BaseEvalCommandParameters,
} from '@configu/ts';
import _ from 'lodash';

export type EvalCommandParameters = BaseEvalCommandParameters & {
  cacheStore?: ConfigStore;
  forceCache?: boolean;
};

export class EvalCommand extends BaseEvalCommand {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  async updateCacheStore(result: EvalCommandReturn) {
    const { schema, set, cacheStore } = this.parameters;
    if (!cacheStore) return;

    const configs = _.mapValues(
      _.pickBy(result, (entry) => entry.result.origin === EvaluatedConfigOrigin.StoreSet),
      (entry) => entry.result.value,
    );
    await new UpsertCommand({ store: cacheStore, set, schema, configs }).run();
  }

  async run() {
    let evalCommandReturn: EvalCommandReturn;

    if (this.parameters.cacheStore && !this.parameters.forceCache) {
      try {
        evalCommandReturn = await super.run();
        await this.updateCacheStore(evalCommandReturn);
      } catch (error) {
        if (error instanceof ConfigStoreError) {
          this.parameters.store = this.parameters.cacheStore;
          evalCommandReturn = await super.run();
        } else {
          throw error;
        }
      }
    } else {
      if (this.parameters.forceCache && this.parameters.cacheStore) {
        this.parameters.store = this.parameters.cacheStore;
      }
      evalCommandReturn = await super.run();
    }

    return evalCommandReturn;
  }
}
