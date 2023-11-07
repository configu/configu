import _ from 'lodash';
import { Command } from '../Command';
import { type Config } from '../types';
import { ConfigError } from '../utils';
import { type ConfigStore } from '../ConfigStore';
import { type ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';
import { EvaluatedConfigOrigin, type EvalCommandReturn } from './EvalCommand';

export type UpsertCommandParameters = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs?: { [key: string]: string };
  pipe?: EvalCommandReturn;
};

export class UpsertCommand extends Command<void> {
  constructor(public parameters: UpsertCommandParameters) {
    super(parameters);
  }

  async run() {
    const { store, set, schema, configs = {}, pipe = {} } = this.parameters;

    if (_.isEmpty(configs) && _.isEmpty(pipe)) {
      return;
    }

    await store.init();

    const pipeConfigs = _(pipe)
      .pickBy((value, key) => {
        const cfgu = schema.contents[key];
        return (
          cfgu &&
          !cfgu.template &&
          value.result.origin !== EvaluatedConfigOrigin.EmptyValue &&
          value.result.origin !== EvaluatedConfigOrigin.SchemaDefault
        );
      })
      .mapValues((value, key) => value.result.value)
      .value();

    const upsertConfigs = _({ ...pipeConfigs, ...configs })
      .entries()
      .map<Config>(([key, value]) => {
        const errorScope: [string, string][] = [
          ['UpsertCommand', `store:${store.type};set:${set.path};schema:${schema.name}`],
          ['parameters.configs', `key:${key};value:${value}`],
        ];

        const cfgu = schema.contents[key];

        if (!cfgu) {
          throw new ConfigError(
            'invalid config key',
            `key "${key}" must be declared on schema ${schema.name}`,
            errorScope,
          );
        }

        if (value) {
          if (cfgu.template) {
            throw new ConfigError(
              'invalid config value',
              `keys declared with template mustn't have a value`,
              errorScope,
            );
          }

          try {
            ConfigSchema.CFGU.VALIDATORS.valueOptions(cfgu, value);
            ConfigSchema.CFGU.VALIDATORS.valueType(cfgu, value);
          } catch (error) {
            throw error?.appendScope?.(errorScope) ?? error;
          }
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
