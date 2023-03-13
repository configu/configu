import { Flags } from '@oclif/core';
import { ConfigSet, ConfigSchema, DeleteCommand } from '@configu/node';
import { BaseCommand } from '../base';

export default class Delete extends BaseCommand<typeof Delete> {
  static description = 'deletes configs from a store';

  static examples = [
    '<%= config.bin %> <%= command.id %> --store "configu" --set "dev/branch" --schema "./node-srv.cfgu.json"',
  ];

  static flags = {
    store: Flags.string({
      description: 'config-store to delete configurations from',
      required: true,
    }),
    set: Flags.string({
      description: 'hierarchy of the configs',
      required: true,
    }),
    schema: Flags.string({
      description: 'path to a <schema>.cfgu.[json] file',
      required: true,
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
