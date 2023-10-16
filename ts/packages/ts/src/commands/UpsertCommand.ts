import _ from 'lodash';
import { Command } from '../Command';
import { type Config } from '../types';
import { ERR } from '../utils';
import { type ConfigStore } from '../ConfigStore';
import { type ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';

export type UpsertCommandParameters = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs: { [key: string]: string };
};

export class UpsertCommand extends Command<void> {
  constructor(public parameters: UpsertCommandParameters) {
    super(parameters);
  }

  async run() {
    const scopeLocation = [`UpsertCommand`, 'run'];
    const { store, set, schema, configs } = this.parameters;

    await store.init();

    const schemaContents = await ConfigSchema.parse(schema);

    const upsertConfigs = _(configs)
      .entries()
      .map<Config>(([key, value]) => {
        const cfgu = schemaContents[key];

        if (!cfgu) {
          throw new Error(
            ERR(`invalid config key "${key}"`, {
              location: scopeLocation,
              suggestion: `key "${key}" must be declared on schema ${schema.path}`,
            }),
          );
        }

        if (value && cfgu.template) {
          throw new Error(
            ERR(`invalid assignment to config key "${key}"`, {
              location: scopeLocation,
              suggestion: `keys declared with template mustn't have a value`,
            }),
          );
        }

        if (value && !ConfigSchema.CFGU.TESTS.VAL_TYPE[cfgu.type]?.({ ...cfgu, value })) {
          throw new Error(
            ERR(`invalid config value "${value}" for key "${key}"`, {
              location: scopeLocation,
              suggestion: `value "${value}" must be of type "${cfgu.type}"`,
            }),
          );
        }

        if (value && cfgu.options && !cfgu.options.some((option) => option === value)) {
          throw new Error(
            ERR(`invalid config value "${value}" for key "${key}"`, {
              location: scopeLocation,
              suggestion: `value '${value} must be one of ${_.map(cfgu.options, (option) => `'${option}'`).join(',')}`,
            }),
          );
        }

        return {
          set: set.path,
          key,
          value,
        };
      })
      .value();

    await store.set(upsertConfigs);
  }
}
