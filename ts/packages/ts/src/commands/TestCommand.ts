import { Command } from '../Command';
import { ConfigStore } from '../ConfigStore';

export type TestCommandParameters = {
  store: ConfigStore;
  clean?: boolean;
};

export class TestCommand extends Command<boolean> {
  constructor(public parameters: TestCommandParameters) {
    super(parameters);
  }

  async run(): Promise<boolean> {
    const testConfig = {
      set: '',
      key: 'CONFIGU_TEST',
      value: Date.now().toString(),
    };
    try {
      await this.parameters.store.init();
      await this.parameters.store.set([testConfig]);
      if (this.parameters.clean) {
        testConfig.value = '';
        await this.parameters.store.set([testConfig]);
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
