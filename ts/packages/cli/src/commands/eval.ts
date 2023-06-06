import { Flags } from '@oclif/core';
import { EvalCommandParameters } from '@configu/ts';
import { NoopConfigStore, ConfigSet, ConfigSchema, EvalCommand } from '@configu/node';
import { BaseCommand } from '../base';

export default class Eval extends BaseCommand<typeof Eval> {
  static description = 'fetches configs from config-store on demand based on config-set and config-schema';

  static examples = [
    "<%= config.bin %> <%= command.id %> --store 'configu' --set 'production' --schema './get-started.cfgu.json' | <%= config.bin %> <%= command.id %> --store 'configu' --set 'my-service' --schema './my-service.cfgu.json' --config 'K=V' | <%= config.bin %> export --format 'Dotenv'",
    "<%= config.bin %> <%= command.id %> --schema './node-srv.cfgu.json'",
  ];

  static flags = {
    store: Flags.string({
      description: `config-store (configs data-source) to fetch configs from`,
      aliases: ['st'],
    }),
    set: Flags.string({
      description: `config-set (config-values context) hierarchy path to fetch configs from`,
      aliases: ['se'],
    }),
    schema: Flags.string({
      description: `config-schema (config-keys declaration) path/to/[schema].cfgu.json file to fetch configs from`,
      required: true,
      aliases: ['sc'],
    }),
    config: Flags.string({
      description: `key=value pairs to override fetched configs`,
      multiple: true,
      char: 'c',
    }),
  };

  async constructEvalCommandParameters(): Promise<EvalCommandParameters> {
    const { store, set, schema, config } = this.flags;

    // * just for safety
    if (typeof schema !== 'string') {
      throw new Error(`--schema flag is missing`);
    }

    const configs = this.reduceConfigFlag(config);
    const previous = await this.readPreviousEvalCommandReturn();

    if (typeof store === 'string' && (typeof set === 'string' || set === undefined)) {
      const storeInstance = this.getStoreInstanceByStoreFlag(store);
      return {
        store: storeInstance,
        set: new ConfigSet(set),
        schema: new ConfigSchema(schema),
        configs,
        previous,
      };
    }

    return {
      store: new NoopConfigStore(),
      set: new ConfigSet(),
      schema: new ConfigSchema(schema),
      configs,
      previous,
    };
  }

  public async run(): Promise<void> {
    const evalCommandParameters = await this.constructEvalCommandParameters();
    const evalCommandReturn = await new EvalCommand(evalCommandParameters).run();

    this.log(JSON.stringify(evalCommandReturn), undefined, 'stdout');
  }
}
