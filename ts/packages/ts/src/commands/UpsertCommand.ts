import _ from 'lodash';
import { Command } from '../Command';
import { Config } from '../types';
import { ERR } from '../utils';
import { ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';

export type UpsertCommandParameters = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs: { key: string; value?: string }[];
};

export class UpsertCommand extends Command<void> {
  constructor(public parameters: UpsertCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema, configs } = this.parameters;

    await store.init();

    const schemaContents = await ConfigSchema.parse(schema);

    const upsertConfigs = _(configs)
      .map<Config>(({ key, value = '' }, idx) => {
        const cfgu = schemaContents[key];
        if (!cfgu) {
          throw new Error(
            ERR(`invalid key ${key}`, {
              location: [`parameters.config[${idx}]`],
              suggestion: `key must be declared on the passed schema`,
            }),
          );
        }

        if (value && cfgu.template) {
          throw new Error(
            ERR(`invalid key ${key}`, {
              location: [`parameters.config[${idx}]`],
              suggestion: `keys declared with a template mustn't have a value`,
            }),
          );
        }

        const referenceValue = ConfigStore.extractReferenceValue(value);
        if (referenceValue && !ConfigStore.parseReferenceValue(referenceValue)) {
          throw new Error(
            ERR(`invalid value ${value}`, {
              location: [`parameters.config[${idx}]`],
              suggestion: `reference value must be a valid connection string - store=<store.type>;query=[set/]<schema>[.key]`,
            }),
          );
        }

        if (!referenceValue && !ConfigSchema.validateValueType({ ...cfgu, value })) {
          throw new Error(
            ERR(`invalid value ${value}`, {
              location: [`parameters.config[${idx}]`],
              suggestion: `"${value}" must be of type "${cfgu.type}"`,
            }),
          );
        }

        return {
          set: set.path,
          schema: schema.uid,
          key,
          value,
        };
      })
      .value();

    await store.set(upsertConfigs);

    return { data: undefined };
  }
}
