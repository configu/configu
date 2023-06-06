import { Flags } from '@oclif/core';
import { ConfigSet, ConfigSchema, DeleteCommand } from '@configu/node';
import { BaseCommand } from '../base';

export default class Delete extends BaseCommand<typeof Delete> {
  static description = 'deletes configs from a config-store';

  static examples = [
    "<%= config.bin %> <%= command.id %> --store 'configu' --set 'dev/branch' --schema './node-srv.cfgu.json'",
  ];

  static flags = {
    store: Flags.string({
      description: `config-store (configs data-source) to delete configs from`,
      required: true,
      aliases: ['st'],
    }),
    set: Flags.string({
      description: `config-set (config-values context) hierarchy path to delete configs from`,
      required: true,
      aliases: ['se'],
    }),
    schema: Flags.string({
      description: `config-schema (config-keys declaration) path/to/[schema].cfgu.json file to delete configs from`,
      required: true,
      aliases: ['sc'],
    }),
  };

  public async run(): Promise<void> {
    const store = await this.getStoreInstanceByStoreFlag(this.flags.store);
    const set = new ConfigSet(this.flags.set);
    const schema = new ConfigSchema(this.flags.schema);

    await new DeleteCommand({
      store,
      set,
      schema,
    }).run();
    this.log(`configs deleted successfully`);
  }
}
