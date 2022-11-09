import _ from 'lodash';
import { Command } from '../Command';
import { Config } from '../types';
import { Store } from '../Store';
import { Set } from '../Set';
import { Cfgu } from '../Cfgu';
import { ERR } from '../utils';

export type UpsertCommandParameters = {
  store: Store;
  set: Set;
  schema: Cfgu;
  configs: { key: string; value?: string }[];
};

export class UpsertCommand extends Command<void> {
  constructor(public parameters: UpsertCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema, configs } = this.parameters;

    const cfguContents = await Cfgu.parse(schema);

    const upsertConfigs = _(configs)
      .map<Config>(({ key, value = '' }, idx) => {
        const configSchema = cfguContents[key];
        if (!configSchema) {
          throw new Error(
            ERR(`invalid key ${key}`, [`parameters.config[${idx}]`], `key must be declared on the passed schema`),
          );
        }

        if (value && configSchema.template) {
          throw new Error(
            ERR(
              `invalid key ${key}`,
              [`parameters.config[${idx}]`],
              `keys declared with a template mustn't have a value`,
            ),
          );
        }

        const referenceValue = Store.extractReferenceValue(value);
        if (referenceValue && !Store.parseReferenceValue(referenceValue)) {
          throw new Error(
            ERR(
              `invalid value ${value}`,
              [`parameters.config[${idx}]`],
              `reference value must be a valid uri - <scheme>://[userinfo@][set/]<schema>[.key]`,
            ),
          );
        }

        if (!referenceValue && !Cfgu.validateValueType({ ...configSchema, value })) {
          throw new Error(
            ERR(
              `invalid value ${value}`,
              [`parameters.config[${idx}]`],
              `"${value}" must be of type "${configSchema.type}"`,
            ),
          );
        }

        return {
          set: set.path,
          schema: schema.name,
          key,
          value,
        };
      })
      .value();

    await store.set(upsertConfigs);

    return { data: undefined };
  }
}
