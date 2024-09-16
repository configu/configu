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
  backupStore?: ConfigStore;
  evalFromBackup?: boolean;
};

export class EvalCommand extends BaseEvalCommand {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  async updateBackupStore(result: EvalCommandReturn) {
    const { schema, set, backupStore } = this.parameters;
    if (!backupStore) return;

    const configs = _.mapValues(
      _.pickBy(result, (entry) => entry.result.origin === EvaluatedConfigOrigin.StoreSet),
      (entry) => entry.result.value,
    );
    await new UpsertCommand({ store: backupStore, set, schema, configs }).run();
  }

  async run() {
    let evalCommandReturn: EvalCommandReturn;

    if (this.parameters.backupStore && !this.parameters.evalFromBackup) {
      try {
        evalCommandReturn = await super.run();
        await this.updateBackupStore(evalCommandReturn);
      } catch (error) {
        if (error instanceof ConfigStoreError) {
          this.parameters.store = this.parameters.backupStore;
          evalCommandReturn = await super.run();
        } else {
          throw error;
        }
      }
    } else {
      if (this.parameters.evalFromBackup && this.parameters.backupStore) {
        this.parameters.store = this.parameters.backupStore;
      }
      evalCommandReturn = await super.run();
    }

    return evalCommandReturn;
  }
}
