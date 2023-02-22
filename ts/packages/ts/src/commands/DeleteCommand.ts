import _ from 'lodash';
import { Command } from '../Command';
import { Config, ConfigStoreQuery } from '../types';
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
    const scopeLocation = [`DeleteCommand`, 'run'];
    const { store, set, schema } = this.parameters;

    if (!set && !schema) {
      throw new Error(
        ERR('invalid set or schema parameters', {
          location: scopeLocation,
          suggestion: 'one of them must be supplied',
        }),
      );
    }

    await store.init();

    let storeQueries: ConfigStoreQuery[] = [];
    if (set && !schema) {
      storeQueries = [{ set: set.path, key: '*' }];
    }
    if (schema) {
      const schemaContents = await ConfigSchema.parse(schema);
      storeQueries = _(schemaContents)
        .keys()
        .map((key) => ({ set: set?.path ?? '*', key }))
        .value();
    }

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
