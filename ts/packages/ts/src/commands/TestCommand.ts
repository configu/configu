import { Command } from '../Command';
import { ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { InMemoryConfigSchema } from '../ConfigSchema';
import { UpsertCommand } from './UpsertCommand';

const TestCommandSchema = new InMemoryConfigSchema({
  CONFIGU_TEST: {
    type: 'String',
  },
});

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

    await new UpsertCommand({
      store,
      set,
      schema: TestCommandSchema,
      configs: {
        CONFIGU_TEST: Date.now().toString(),
      },
    }).run();

    if (clean) {
      await new UpsertCommand({
        store,
        set,
        schema: TestCommandSchema,
        configs: {
          CONFIGU_TEST: '',
        },
      }).run();
    }
  }
}
