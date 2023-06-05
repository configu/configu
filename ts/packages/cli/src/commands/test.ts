import { Flags } from '@oclif/core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { TestCommand } from '@configu/node';
import { BaseCommand } from '../base';

export default class Test extends BaseCommand<typeof Test> {
  static description = 'verify credentials and write access to a store';

  static examples = ['<%= config.bin %> <%= command.id %> --store "configu" --clean'];

  static flags = {
    store: Flags.string({
      description: 'config-store to test',
      required: true,
    }),
    clean: Flags.boolean({
      description: 'delete CONFIGU_TEST key from the store',
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
      this.error(`store ${store.type} test failed with error: ${error.message}`);
    }
  }
}
