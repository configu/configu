import _ from 'lodash';
import { Command } from '../Command';
import { Config } from '../types';
import { Store } from '../Store';
import { Set } from '../Set';
import { Cfgu } from '../Cfgu';
import { ERR } from '../utils';

export type DeleteCommandParameters = {
  store: Store;
  set?: Set;
  schema?: Cfgu;
};

export class DeleteCommand extends Command<void> {
  constructor(public parameters: DeleteCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema } = this.parameters;

    if (!set && !schema) {
      throw new Error(ERR('either set or schema parameter should be supplied', ['parameters']));
    }

    await store.init();

    const storedConfigs = await store.get([{ set: set?.path ?? '*', schema: schema?.name ?? '*', key: '*' }]);

    const deleteConfigs = _(storedConfigs)
      .map<Config>((config) => {
        return {
          ...config,
          value: '',
        };
      })
      .value();

    await store.set(deleteConfigs);

    return { data: undefined };
  }
}
