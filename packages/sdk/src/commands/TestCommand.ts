import { ConfigCommand } from './ConfigCommand';
import { type ConfigStore } from '../core/ConfigStore';
import { ConfigSet } from '../core/ConfigSet';
import { ConfigSchema } from '../core/ConfigSchema';
import { UpsertCommand } from './UpsertCommand';

export type TestCommandInput = {
  store: ConfigStore;
  clean?: boolean;
};

export class TestCommand extends ConfigCommand<TestCommandInput, void> {
  constructor(public parameters: TestCommandInput) {
    super(parameters);
  }

  async execute(): Promise<void> {
    const { store, clean } = this.parameters;
    const set = new ConfigSet();
    const schema = new ConfigSchema({
      CONFIGU_TEST: {},
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
