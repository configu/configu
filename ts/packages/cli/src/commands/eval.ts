import { Flags } from '@oclif/core';
import {
  type EvalCommandParameters,
  type EvalCommandReturn,
  EvaluatedConfigOrigin,
  type ConfigStore,
  ConfigStoreError,
  type ConfigSchema,
  UpsertCommand,
} from '@configu/ts';
import { NoopConfigStore, ConfigSet, EvalCommand } from '@configu/node';
import _ from 'lodash';
import { BaseCommand } from '../base';

export default class Eval extends BaseCommand<typeof Eval> {
  static description = `Fetch \`Configs\` from \`ConfigStore\` on demand based on \`ConfigSet\` and \`ConfigSchema\``;

  static examples = [
    {
      description: `Fetch all \`Configs\` declared at \`ConfigSchema\` file at './config/schema.cfgu.json' from the 'prod' \`ConfigSet\` within a 'configu' \`ConfigStore\``,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --set 'prod' --schema './config/schema.cfgu.json'`,
    },
    {
      description: `Fetch all \`Configs\` declared at \`ConfigSchema\` file at './service.cfgu.json' from the 'service' \`ConfigSet\` within a 'configu' \`ConfigStore\` and override 'key1' value`,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --set 'service' --schema './service.cfgu.json' --config 'key1=value1'`,
    },
    {
      description: `Pipe multiple eval commands and export as Kubernetes ConfigMap .yaml file`,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --set 'prod' --schema './config/schema.cfgu.json'
  | <%= config.bin %> <%= command.id %> --store 'configu' --set 'service' --schema './service.cfgu.json' -c 'key1=value1'
  | <%= config.bin %> <%= command.id %> --store 'aws-secrets-manager' --set 'prod' --schema './service.cfgu.json' -c 'key1=value1'
  | <%= config.bin %> export --format 'KubernetesConfigMap' --label 'service-prod' > service-prod.yaml`,
    },
  ];

  static flags = {
    store: Flags.string({
      description: `\`ConfigStore\` (configs data-source) to fetch \`Configs\` from`,
      aliases: ['st'],
    }),
    set: Flags.string({
      description: `\`ConfigSet\` (config-values context) to fetch \`Configs\` from. Use an empty string for the root set`,
      aliases: ['se'],
    }),
    schema: Flags.string({
      description: `\`ConfigSchema\` (config-keys declaration) path/to/[schema].cfgu.json file to operate the eval against. The keys declared in the \`ConfigSchema\` will be fetched and evaluated from the to the \`ConfigStore\`. In case of key duplication from multiple \`ConfigSchema\`, the order of the --schema flag in the pipe will come to hand as the rightmost key overriding the rest`,
      required: true,
      aliases: ['sc'],
    }),
    config: Flags.string({
      description: `'key=value' pairs to override fetched \`Configs\``,
      multiple: true,
      char: 'c',
    }),
    'force-cache': Flags.boolean({
      description: `Force the use of cache store`,
      default: false,
    }),
  };

  async constructEvalCommandParameters(): Promise<EvalCommandParameters> {
    // * just for safety
    if (typeof this.flags.schema !== 'string') {
      throw new Error(`--schema flag is missing`);
    }

    const schema = await this.getSchemaInstanceBySchemaFlag(this.flags.schema);
    const configs = this.reduceConfigFlag(this.flags.config);
    const pipe = await this.readPreviousEvalCommandReturn();

    if (typeof this.flags.store === 'string' && (typeof this.flags.set === 'string' || this.flags.set === undefined)) {
      const store = this.getStoreInstanceByStoreFlag(this.flags.store);
      return {
        store,
        set: new ConfigSet(this.flags.set),
        schema,
        configs,
        pipe,
      };
    }

    return {
      store: new NoopConfigStore(),
      set: new ConfigSet(),
      schema,
      configs,
      pipe,
    };
  }

  async updateCache(
    cacheStore: ConfigStore,
    set: ConfigSet,
    schema: ConfigSchema,
    evalCommandReturn: EvalCommandReturn,
  ) {
    const configs = _.mapValues(
      _.pickBy(evalCommandReturn, (entry) => entry.result.origin === EvaluatedConfigOrigin.StoreSet),
      (entry) => entry.result.value,
    );
    await new UpsertCommand({ store: cacheStore, set, schema, configs }).run();
  }

  public async run(): Promise<void> {
    const cacheStore = this.getCacheStoreInstanceByStoreFlag(this.flags.store);
    const evalCommandParameters = await this.constructEvalCommandParameters();
    let evalCommandReturn;

    if (cacheStore && !this.flags['force-cache']) {
      try {
        evalCommandReturn = await new EvalCommand(evalCommandParameters).run();
        const { schema, set } = evalCommandParameters;
        await this.updateCache(cacheStore, set, schema, evalCommandReturn);
      } catch (error) {
        if (error instanceof ConfigStoreError) {
          evalCommandReturn = await new EvalCommand({ ...evalCommandParameters, store: cacheStore }).run();
        } else {
          throw error;
        }
      }
    } else {
      evalCommandReturn = await new EvalCommand({
        ...evalCommandParameters,
        store: this.flags['force-cache'] && cacheStore ? cacheStore : evalCommandParameters.store,
      }).run();
    }

    this.print(JSON.stringify(evalCommandReturn), { stdout: 'stdout' });
  }
}
