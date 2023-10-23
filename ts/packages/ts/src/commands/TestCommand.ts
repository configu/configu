import { Command } from '../Command';
import { type ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';
import { UpsertCommand } from './UpsertCommand';

export type TestCommandParameters = {
  store: ConfigStore;
  clean?: boolean;
};

export class TestCommand extends Command<void> {
  constructor(public parameters: TestCommandParameters) {
    super(parameters);
  }

  async run(): Promise<void> {
    const { store, clean } = this.parameters;
    const set = new ConfigSet();
    const schema = new ConfigSchema('TestCommandConfigSchema', {
      CONFIGU_TEST: {
        type: 'String',
      },
    });

    await new UpsertCommand({
      store,
      set,
      schema,
      configs: {
        CONFIGU_TEST: Date.now().toString(),
      },
    }).run();

    if (clean) {
      await new UpsertCommand({
        store,
        set,
        schema,
        configs: {
          CONFIGU_TEST: '',
        },
      }).run();
    }
  }
}
