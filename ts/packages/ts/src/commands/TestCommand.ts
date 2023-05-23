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
    return Promise.all([
      this.parameters.store.init(),
      this.parameters.store.set([
        {
          set: '',
          key: 'CONFIGU_TEST',
          value: Date.now().toString(),
        },
      ]),
      (async () =>
        this.parameters.clean
          ? this.parameters.store.set([
              {
                set: '',
                key: 'CONFIGU_TEST',
                value: '',
              },
            ])
          : true)(),
    ])
      .then(() => true)
      .catch(() => false);
  }
}
