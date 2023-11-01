import _ from 'lodash';
import { Command } from '../Command';
import { type Config } from '../types';
import { ConfigError } from '../utils';
import { type ConfigStore } from '../ConfigStore';
import { type ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';
import { type EvalCommandReturn } from './EvalCommand';

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

  private validateConfigValue({
    key,
    value,
    skipDeclarationAndTemplateValidation,
  }: {
    key: string;
    value: string;
    skipDeclarationAndTemplateValidation: boolean;
  }) {
    const { store, set, schema } = this.parameters;

    const errorScope: [string, string][] = [
      ['UpsertCommand', `store:${store.type};set:${set.path};schema:${schema.name}`],
      ['parameters.configs', `key:${key};value:${value}`],
    ];

    const cfgu = schema.contents[key];

    if (!skipDeclarationAndTemplateValidation) {
      if (!cfgu) {
        throw new ConfigError(
          'invalid config key',
          `key "${key}" must be declared on schema ${schema.name}`,
          errorScope,
        );
      }
      if (value !== undefined && cfgu?.template) {
        throw new ConfigError('invalid config value', `keys declared with template mustn't have a value`, errorScope);
      }
    }

    if (value !== undefined && cfgu) {
      try {
        ConfigSchema.CFGU.VALIDATORS.valueOptions(cfgu, value);
        ConfigSchema.CFGU.VALIDATORS.valueType(cfgu, value);
      } catch (error) {
        throw error?.appendScope?.(errorScope) ?? error;
      }
    }
  }

  async run() {
    const { store, set, schema, configs, pipe } = this.parameters;

    if (_.isEmpty(configs) && _.isEmpty(pipe)) {
      return;
    }

    await store.init();

    const pipeConfigs = _(pipe)
      .entries()
      .filter(([key]) => {
        const schemaCfgu = schema.contents[key];
        if (!schemaCfgu) {
          return false;
        }
        return !schemaCfgu.template;
      })
      .map(([key, value]) => {
        this.validateConfigValue({ key, value: value.result.value, skipDeclarationAndTemplateValidation: true });
        return {
          set: set.path,
          key,
          value: value.result.value,
        };
      })
      .value();

    const upsertConfigs = _(configs)
      .entries()
      .map<Config>(([key, value]) => {
        this.validateConfigValue({ key, value, skipDeclarationAndTemplateValidation: false });
        return {
          set: set.path,
          key,
          value,
        };
      })
      .value();

    const configsToUpsert = _.unionBy(upsertConfigs, pipeConfigs, 'key');

    await store.set(configsToUpsert);
  }
}
