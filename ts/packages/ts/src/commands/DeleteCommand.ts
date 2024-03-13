import _ from 'lodash';
import { Command } from '../Command';
import { type Config } from '../types';
import { type ConfigStore } from '../ConfigStore';
import { type ConfigSet } from '../ConfigSet';
import { type ConfigSchema } from '../ConfigSchema';

export type DeleteCommandParameters = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
};

export class DeleteCommand extends Command<void> {
  constructor(public parameters: DeleteCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema } = this.parameters;

    await store.init();

    const storeQueries = _(schema.contents)
      .keys()
      .map((key) => ({ set: set.path, key }))
      .value();

    const storedConfigs = await store.get(storeQueries);

    const deleteConfigs = _(storedConfigs)
      .map<Config>((config) => {
        return {
          ...config,
          value: '',
        };
      })
      .value();

    await store.set(deleteConfigs);
  }
}
