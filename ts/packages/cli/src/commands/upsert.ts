import { Flags } from '@oclif/core';
import _ from 'lodash';
import { EvaluatedConfigsArray } from '@configu/ts';
import { ConfigSet, ConfigSchema, UpsertCommand } from '@configu/node';
import { extractConfigs } from '@configu/lib';
import { BaseCommand } from '../base';
import { constructStoreFromConnectionString } from '../helpers/stores';

export default class Upsert extends BaseCommand {
  static description = 'creates, updates or deletes configs from a store';

  static examples = [
    '<%= config.bin %> <%= command.id %> --store "configu" --set "prod" --schema "./node-srv.cfgu.json" --config NODE_ENV=production --config LOG_LEVEL=error',
  ];

  static flags = {
    store: Flags.string({
      description: 'config-store to upsert configurations to',
      required: true,
    }),
    set: Flags.string({
      description: 'hierarchy of the configs',
      required: true,
    }),
    schema: Flags.string({
      description: 'path to a <schema>.cfgu.[json|yaml] file',
      required: true,
    }),

    config: Flags.string({
      description: 'key=value pairs to upsert (empty value means delete)',
      exclusive: ['import'],
      multiple: true,
      char: 'c',
    }),
    import: Flags.string({
      description: 'use this flag to import an existing .env file and create configs from it',
      exclusive: ['config'],
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Upsert);

    const storeCS = this.config.configData.stores?.[flags.store] ?? flags.store;
    const { store } = await constructStoreFromConnectionString(storeCS);

    const set = new ConfigSet(flags.set);
    const schema = new ConfigSchema(flags.schema);

    let configs: EvaluatedConfigsArray = [];

    if (flags.config) {
      configs = flags.config.map((pair) => {
        const [key, ...rest] = pair.split('=');
        const value = rest.join('='); // * ...rest and join used here to handle reference-value formed as connection-string
        if (!key) {
          throw new Error('invalid config flag');
        }
        return { key, value };
      });
    }

    if (flags.import) {
      const fileContent = await this.readFile(flags.import);
      const extractedConfigs = extractConfigs({
        filePath: flags.import,
        fileContent,
      });
      configs = extractedConfigs.map((ex) => _.pick(ex, ['key', 'value']));
    }

    await new UpsertCommand({
      store,
      set,
      schema,
      configs,
    }).run();
    this.log(`configs upserted successfully`);
  }
}
