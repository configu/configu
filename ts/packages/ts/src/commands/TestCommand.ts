import { createHash } from 'crypto';
import { Command } from '../Command';
import { ConfigStore } from '../ConfigStore';

export type TestCommandParameters = {
  store: ConfigStore;
};

export class TestCommand extends Command<boolean> {
  constructor(public parameters: TestCommandParameters) {
    super(parameters);
  }

  async run(): Promise<boolean> {
    await this.parameters.store.init();
    await this.parameters.store.set([
      {
        set: '',
        key: 'CONFIGU_TEST',
        value: createHash('md5').update(new Date().toString()).digest('hex'),
      },
    ]);
    return Promise.resolve(false);
  }
}
