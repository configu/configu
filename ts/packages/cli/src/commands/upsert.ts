import { Flags } from '@oclif/core';
import _ from 'lodash';
import { ConfigSet, ConfigSchema, UpsertCommand } from '@configu/node';
import { extractConfigs } from '@configu/lib';
import { BaseCommand } from '../base';

export default class Upsert extends BaseCommand<typeof Upsert> {
  static description = 'creates, updates or deletes configs from a config-store';

  static examples = [
    "<%= config.bin %> <%= command.id %> --store 'configu' --set 'prod' --schema './node-srv.cfgu.json' --config 'NODE_ENV=production' --config 'LOG_LEVEL=error'",
  ];

  static flags = {
    store: Flags.string({
      description: `config-store (configs data-source) to upsert configs to`,
      required: true,
      aliases: ['st'],
    }),
    set: Flags.string({
      description: `config-set (config-values context) hierarchy path to upsert configs to`,
      required: true,
      aliases: ['se'],
    }),
    schema: Flags.string({
      description: `config-schema (config-keys declaration) path/to/[schema].cfgu.json file to upsert configs to`,
      required: true,
      aliases: ['sc'],
    }),

    config: Flags.string({
      description: 'key=value pairs to upsert configs (empty value means delete)',
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
    const store = await this.getStoreInstanceByStoreFlag(this.flags.store);
    const set = new ConfigSet(this.flags.set);
    const schema = new ConfigSchema(this.flags.schema);

    let configs = this.reduceConfigFlag(this.flags.config);
    if (this.flags.import) {
      const fileContent = await this.readFile(this.flags.import);
      const extractedConfigs = extractConfigs({
        filePath: this.flags.import,
        fileContent,
      });
      configs = _.mapValues(extractedConfigs, 'value');
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
