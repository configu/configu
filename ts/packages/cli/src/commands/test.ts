import { Flags } from '@oclif/core';
import { TestCommand } from '@configu/node';
import { BaseCommand } from '../base';

export default class Test extends BaseCommand<typeof Test> {
  static description = 'verify credentials and write access to a config-store';

  static examples = ["<%= config.bin %> <%= command.id %> --store 'configu' --clean"];

  static flags = {
    store: Flags.string({
      description: `config-store (configs data-source) to upsert CONFIGU_TEST to`,
      required: true,
      aliases: ['st'],
    }),
    clean: Flags.boolean({
      description: 'delete CONFIGU_TEST from the config-store after test',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const store = await this.getStoreInstanceByStoreFlag(this.flags.store);

    try {
      await new TestCommand({ store, clean: this.flags.clean }).run();
      this.log(`test passed for store ${this.flags.store} of type ${store.type}`);
    } catch (error) {
      throw new Error(`test failed for store ${this.flags.store} of type ${store.type} with error: ${error.message}`);
    }
  }
}
