import { Command, Option } from 'clipanion';
import * as prompts from '@clack/prompts';
import { ConfigSet, ConfigStore, EvalCommand } from '@configu/sdk';
import { print, ConfiguInterface } from '@configu/common';
import { BaseCommand } from './base';

export class CliEvalCommand extends BaseCommand {
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
  });

  defaults = Option.Boolean('--defaults', {});

  override = Option.Array('--override,--kv', {
    description: `'key=value' pairs to override fetched \`Configs\``,
  });

  async execute() {
    const spinner = prompts.spinner();

    try {
      spinner.start(`Initializing Eval`);
      await this.init();

      spinner.message(`Constructing Store ${this.store}`);
      const store = this.defaults ? ConfigStore.construct('noop') : await ConfiguInterface.getStoreInstance(this.store);

      spinner.message(`Constructing Set ${this.set}`);
      const set = new ConfigSet(this.set);

      spinner.message(`Constructing Schema ${this.schema}`);
      const schema = await ConfiguInterface.getSchemaInstance(this.schema);

      spinner.message(`Parsing overrides`);
      const configs = this.reduceKVFlag(this.override);

      spinner.message(`Reading previous eval command output`);
      const pipe = await this.readPreviousEvalCommandOutput();

      spinner.message(`Evaluating Configs`);
      const evalCommand = new EvalCommand({ store, set, schema, configs, pipe });
      const { result } = await evalCommand.run();

      spinner.message(`Backing up output`);
      await ConfiguInterface.backupEvalOutput({ storeName: this.store, set, schema, evalOutput: result });

      print(JSON.stringify(result));
      spinner.stop(`Configs evaluated successfully`, 0);
    } catch (error) {
      spinner.stop(`Configs eval failed`, 1);
      throw error;
    }
  }
}
