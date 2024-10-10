import { Command, Option } from 'clipanion';
import { TestCommand as BaseTestCommand, ConfigStore } from '@configu/sdk';
import { BaseCommand } from './base';

export class TestCommand extends BaseCommand {
  static override paths = [['test']];

  static override usage = Command.Usage({
    description: `Test connection to a \`ConfigStore\``,
  });

  store = Option.String('--store,--st', {
    description: `\`ConfigStore\` (configs data-source) to fetch \`Configs\` from`,
    required: true,
  });

  clean = Option.Boolean('--clean', {
    description: `Delete \`CONFIGU_TEST\` config from the \`ConfigStore\` after test completed`,
  });

  async execute() {
    await this.init();
    const store = this.getStoreInstanceByStoreFlag(this.store);

    try {
      await new BaseTestCommand({ store, clean: this.clean }).run();
      process.stdout.write(`Test passed for store ${this.store}`);
    } catch (error) {
      this.context.stdio.error(`Test failed for store ${this.store} with error: ${error.message}`);
    }
  }
}
