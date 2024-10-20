import { Command, Option } from 'clipanion';
import { UpsertCommand as BaseUpsertCommand, ConfigSet } from '@configu/sdk';
import { ConfiguConfigStoreApprovalQueueError } from '@configu/common';
import { BaseCommand } from './base';

export class UpsertCommand extends BaseCommand {
  static override paths = [['upsert'], ['up']];

  static override usage = Command.Usage({
    description: `Create, update or delete \`Configs\` from a \`ConfigStore\``,
  });

  store = Option.String('--store,--st', {
    description: `\`ConfigStore\` (configs data-source) to upsert \`Configs\` to`,
    required: true,
  });

  set = Option.String('--set,--se', {
    description: `\`ConfigSet\` (config-values context) to assign the upserted \`Configs\`. Use an empty string for the root set`,
  });

  schema = Option.String('--schema,--sc', {
    description: `\`ConfigSchema\` (config-keys declaration) path/to/[schema].cfgu.json file to operate the upsert against. The keys declared in the \`ConfigSchema\` can be assigned a value in the \`ConfigSet\` that will be upserted as a \`Config\` to the \`ConfigStore\``,
    required: true,
  });

  config = Option.Array('--config,-c', {
    description: `'key=value' pairs to upsert. Use an empty value to delete a \`Config\``,
  });

  async execute() {
    await this.init();
    const store = this.getStoreInstanceByStoreFlag(this.store ?? 'noop');
    const set = new ConfigSet(this.set);
    const schema = await this.getSchemaInstanceByFlag(this.schema);
    const configs = this.reduceConfigFlag(this.config);
    const pipe = await this.readPreviousEvalCommandOutput();

    try {
      await new BaseUpsertCommand({
        store,
        set,
        schema,
        configs,
        pipe,
      }).run();
      process.stdout.write('Configs upserted successfully');
    } catch (error) {
      if (error instanceof ConfiguConfigStoreApprovalQueueError) {
        // * print warning message with queue url highlighted with an underline
        const warningMessage = error.message.replace(error.queueUrl, `\u001B[4m${error.queueUrl}\u001B[0m`);
        this.context.stdio.warn(warningMessage);
      } else {
        this.context.stdio.error(error.message);
      }
    }
  }
}
