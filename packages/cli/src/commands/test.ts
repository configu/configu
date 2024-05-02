import { Flags } from '@oclif/core';
import { TestCommand } from '@configu/node';
import { BaseCommand } from '../base';

export default class Test extends BaseCommand<typeof Test> {
  static description = `Verify credentials and write access to a \`ConfigStore\``;

  static examples = [
    {
      description: `Test connection to a 'configu' \`ConfigStore\``,
      command: `<%= config.bin %> <%= command.id %> --store 'configu'`,
    },
    {
      description: `Test connection to a 'configu' \`ConfigStore\` and clean afterwards`,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --clean`,
    },
  ];

  static flags = {
    store: Flags.string({
      description: `\`ConfigStore\` (configs data-source) to upsert \`CONFIGU_TEST\` config to`,
      required: true,
      aliases: ['st'],
    }),
    clean: Flags.boolean({
      description: `Delete \`CONFIGU_TEST\` config from the \`ConfigStore\` after test completed`,
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const store = this.getStoreInstanceByStoreFlag(this.flags.store);

    try {
      await new TestCommand({ store, clean: this.flags.clean }).run();
      this.print(`Test passed for store ${this.flags.store} of type ${store.type}`, { symbol: 'success' });
    } catch (error) {
      throw new Error(`Test failed for store ${this.flags.store} of type ${store.type} with error: ${error.message}`);
    }
  }
}
