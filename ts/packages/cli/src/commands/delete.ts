import { Flags } from '@oclif/core';
import { ConfigSet, ConfigSchema, DeleteCommand } from '@configu/node';
import { BaseCommand } from '../base';
import { constructStoreFromConnectionString } from '../helpers/stores';

export default class Delete extends BaseCommand {
  static description = 'deletes configs from a store';

  static examples = [
    '<%= config.bin %> <%= command.id %> --store "configu" --set "dev/some-branch"',
    '<%= config.bin %> <%= command.id %> --store "configu" --schema "./node-srv.cfgu.json"',
    '<%= config.bin %> <%= command.id %> --store "configu" --set "dev" --schema "./node-srv.cfgu.json"',
  ];

  static flags = {
    store: Flags.string({
      description: 'config-store to delete configurations from',
      required: true,
    }),
    set: Flags.string({
      description: 'hierarchy of the configs',
    }),
    schema: Flags.string({
      description: 'path to a <schema>.cfgu.[json|yaml] file',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Delete);

    const storeCS = this.config.configData.stores?.[flags.store] ?? flags.store;
    const { store } = await constructStoreFromConnectionString(storeCS);

    const set = flags.set ? new ConfigSet(flags.set) : undefined;
    const schema = flags.schema ? new ConfigSchema(flags.schema) : undefined;

    await new DeleteCommand({
      store,
      set,
      schema,
    }).run();
    this.log(`configs deleted successfully`);
  }
}
