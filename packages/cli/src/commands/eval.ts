import { Command, Option } from 'clipanion';
import {
  ConfigSet,
  EvalCommand as BaseEvalCommand,
  ConfigStore,
  ConfigSchema,
  EvalCommandOutput,
  EvaluatedConfigOrigin,
  UpsertCommand,
} from '@configu/sdk';
import _ from 'lodash';
import { BaseCommand } from './base';

export class EvalCommand extends BaseCommand {
  static override paths = [['eval'], ['ev']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: `Fetch \`Configs\` from \`ConfigStore\` on demand based on \`ConfigSet\` and \`ConfigSchema\``,
    // details: `
    //   A longer description of the command with some \`markdown code\`.

    //   Multiple paragraphs are allowed. Clipanion will take care of both reindenting the content and wrapping the paragraphs as needed.
    // `,
    // examples: [
    //   [`A basic example`, `$0 my-command`],
    //   [`A second example`, `$0 my-command --with-parameter`],
    // ],
  });

  store = Option.String('--store,--st', {
    description: `\`ConfigStore\` (configs data-source) to fetch \`Configs\` from`,
  });

  set = Option.String('--set,--se', {
    description: `\`ConfigSet\` (config-values context) to fetch \`Configs\` from. Use an empty string for the root set`,
  });

  schema = Option.String('--schema,--sc', {
    description: `\`ConfigSchema\` (config-keys declaration) path/to/[schema].cfgu.json file to operate the eval against. The keys declared in the \`ConfigSchema\` will be fetched and evaluated from the to the \`ConfigStore\`. In case of key duplication from multiple \`ConfigSchema\`, the order of the --schema flag in the pipe will come to hand as the rightmost key overriding the rest`,
    required: true,
  });

  config = Option.Array('--config,-c', {
    description: `'key=value' pairs to override fetched \`Configs\``,
  });

  async updateBackupStore(
    backupStore: ConfigStore,
    set: ConfigSet,
    schema: ConfigSchema,
    evalCommandOutput: EvalCommandOutput,
  ) {
    const configs = _.mapValues(
      _.pickBy(evalCommandOutput, (entry) => entry.origin === EvaluatedConfigOrigin.Store),
      (entry) => entry.value,
    );
    await new UpsertCommand({ store: backupStore, set, schema, configs }).run();
  }

  async execute() {
    await this.init();

    const store = await this.getStoreInstanceByStoreFlag(this.store ?? 'noop');
    const backupStore = await this.getBackupStoreInstanceByFlag(this.store);
    const set = new ConfigSet(this.set);
    const schema = await this.getSchemaInstanceByFlag(this.schema);
    const configs = this.reduceConfigFlag(this.config);
    const pipe = await this.readPreviousEvalCommandOutput();

    const evalCommand = new BaseEvalCommand({ store, set, schema, configs, pipe });
    const { result } = await evalCommand.run();

    if (backupStore) {
      await this.updateBackupStore(backupStore, set, schema, result);
    }

    process.stdout.write(JSON.stringify(result));
  }
}
