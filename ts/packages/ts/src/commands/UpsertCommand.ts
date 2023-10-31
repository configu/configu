import _ from 'lodash';
import { Command } from '../Command';
import { type Config } from '../types';
import { ConfigError } from '../utils';
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
    const { store, set, schema, configs } = this.parameters;

    await store.init();
    const allAliases = new Set<string>();
    const allSchemaKeys = _(schema.contents).keys().value();

    const upsertConfigs = _(configs)
      .entries()
      .map<Config>(([key, value]) => {
        const errorScope: [string, string][] = [
          ['UpsertCommand', `store:${store.type};set:${set.path};schema:${schema.name}`],
          ['parameters.configs', `key:${key};value:${value}`],
        ];

        let cfgu = schema.contents[key];
        let aliasKey = '';
        if (!cfgu) {
          allSchemaKeys.forEach((k) => {
            const a = schema.contents[k];
            if (a && a.aliases && !aliasKey && a.aliases.some((alias) => alias === key)) {
              aliasKey = k;
              cfgu = a;
            }
          });
        }

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

          if (cfgu.aliases) {
            if (allAliases.has(key)) {
              throw new ConfigError(
                'invalid config key',
                `every key can be key of a cfgu or any of the aliases and should belong to different cfgu ${key}`,
                errorScope,
              );
            } else {
              if (aliasKey) {
                allAliases.add(aliasKey);
              } else {
                allAliases.add(key);
              }
              cfgu.aliases.forEach((alias) => {
                allAliases.add(alias);
              });
            }
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
