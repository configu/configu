import _ from 'lodash';
import { Command } from '../Command';
import { Config } from '../types';
import { ERR } from '../utils';
import { ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';

export type DeleteCommandParameters = {
  store: ConfigStore;
  set?: ConfigSet;
  schema?: ConfigSchema;
};

export class DeleteCommand extends Command<void> {
  constructor(public parameters: DeleteCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema } = this.parameters;

    if (!set && !schema) {
      throw new Error(
        ERR('invalid set or schema parameters', {
          location: [`DeleteCommand`, 'run'],
          suggestion: 'one of them must be supplied',
        }),
      );
    }

    await store.init();

    const storedConfigs = await store.get([{ set: set?.path ?? '*', schema: schema?.uid ?? '*', key: '*' }]);

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
