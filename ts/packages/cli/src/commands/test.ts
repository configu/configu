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
    const { clean } = this.flags;

    try {
      await new TestCommand({ store, clean }).run();
      this.log(`store ${store.type} test passed`);
    } catch (error) {
      throw new Error(`store ${store.type} test failed with error: ${error.message}`);
    }
  }
}
