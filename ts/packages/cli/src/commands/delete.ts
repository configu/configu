import { Flags } from '@oclif/core';
import { Set, Cfgu, DeleteCommand } from '@configu/node';
import { BaseCommand } from '../base';
import { constructStoreFromUrl } from '../helpers/stores';

export default class Delete extends BaseCommand {
  static description = 'tbd';

  static examples = ['<%= config.bin %> <%= command.id %> tbd'];

  static flags = {
    store: Flags.string({ description: 'tbd', default: 'default' }),
    set: Flags.string({ description: 'tbd' }),
    schema: Flags.string({ description: 'tbd' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Delete);

    const storeUrl = this.config.configData.stores?.[flags.store] ?? flags.store;
    const { store } = await constructStoreFromUrl(storeUrl);

    const set = flags.set ? new Set(flags.set) : undefined;
    const schema = flags.schema ? new Cfgu(flags.schema) : undefined;

    await new DeleteCommand({
      store,
      set,
      schema,
    }).run();
  }
}
