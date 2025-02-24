import { Command, Option } from 'clipanion';
import * as prompts from '@clack/prompts';
import { ConfigSet, UpsertCommand } from '@configu/sdk';
import { print, ConfiguInterface } from '@configu/common';
// import { ConfiguPlatformConfigStoreApprovalQueueError } from '@configu/configu';
import { BaseCommand } from './base';

export class CliUpsertCommand extends BaseCommand {
  static override paths = [['upsert'], ['up']];

  static override usage = Command.Usage({
    description: `Create, update or delete \`Configs\` from a \`ConfigStore\``,
  });

  store = Option.String('--store,--st', {
    description: `\`ConfigStore\` (configs data-source) to upsert \`Configs\` to`,
  });

  set = Option.String('--set,--se', {
    description: `\`ConfigSet\` (config-values context) to assign the upserted \`Configs\`. Use an empty string for the root set`,
  });

  schema = Option.String('--schema,--sc', {
    description: `\`ConfigSchema\` (config-keys declaration) path/to/[schema].cfgu.json file to operate the upsert against. The keys declared in the \`ConfigSchema\` can be assigned a value in the \`ConfigSet\` that will be upserted as a \`Config\` to the \`ConfigStore\``,
  });

  assign = Option.Array('--assign,--kv', {
    description: `'key=value' pairs to upsert. Use an empty value to delete a \`Config\``,
  });

  async execute() {
    const spinner = prompts.spinner();

    try {
      spinner.start(`Initializing Upsert`);
      await this.init();

      spinner.message(`Constructing store`);
      const store = await ConfiguInterface.getStoreInstance(this.store);

      spinner.message(`Constructing set`);
      const set = new ConfigSet(this.set);

      spinner.message(`Constructing schema`);
      const schema = await ConfiguInterface.getSchemaInstance(this.schema);

      spinner.message(`Parsing assignments`);
      const configs = this.reduceKVFlag(this.assign);

      spinner.message(`Reading previous eval command output`);
      const pipe = await this.readPreviousEvalCommandOutput();

      spinner.message(`Upserting Configs`);
      await new UpsertCommand({
        store,
        set,
        schema,
        configs,
        pipe,
      }).run();
      spinner.stop(`Configs upserted successfully`, 0);
      // prompts.log.success('Configs upserted successfully');
    } catch (error) {
      //   // if (error instanceof ConfiguPlatformConfigStoreApprovalQueueError) {
      //   //   // * print warning message with queue url highlighted with an underline
      //   //   const warningMessage = error.message.replace(error.queueUrl, `\u001B[4m${error.queueUrl}\u001B[0m`);
      //   //   this.context.stdio.warn(warningMessage);
      //   // } else {
      //   //   this.context.stdio.error(error.message);
      //   // }
      // this.context.stdio.error(error.message);
      spinner.stop(`Configs upsert failed`, 1);
      throw error;
    }
  }
}
