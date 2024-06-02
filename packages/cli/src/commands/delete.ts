import { Flags } from '@oclif/core';
import { ConfigSet, DeleteCommand } from '@configu/node';
import { BaseCommand } from '../base';

export default class Delete extends BaseCommand<typeof Delete> {
  static description = `Bulk delete \`Configs\` from a \`ConfigStore\``;

  static examples = [
    {
      description: `Delete all \`Configs\` declared at \`ConfigSchema\` file at './config/schema.cfgu.json' from a \`ConfigSet\` called 'dev/branch' within a 'configu' \`ConfigStore\``,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --set 'dev/branch' --schema './config/schema.cfgu.json'`,
    },
    {
      description: `Delete all \`Configs\` declared at \`ConfigSchema\` file at './config/schema.cfgu.json' from the 'staging' \`ConfigSet\` within a 'hashicorp-vault' \`ConfigStore\``,
      command: `<%= config.bin %> <%= command.id %> --store 'hashicorp-vault' --set 'staging' --schema './config/schema.cfgu.json'`,
    },
  ];

  static flags = {
    store: Flags.string({
      description: `\`ConfigStore\` (configs data-source) to delete \`Configs\` from`,
      required: true,
      aliases: ['st'],
    }),
    set: Flags.string({
      description: `\`ConfigSet\` (config-values context) to delete \`Configs\` from. Use an empty string for the root set`,
      required: true,
      aliases: ['se'],
    }),
    schema: Flags.string({
      description: `\`ConfigSchema\` (config-keys declaration) path/to/[schema].cfgu.json file to operate the delete against. The keys declared in the \`ConfigSchema\` and its values from the \`ConfigSet\` will be deleted from the \`ConfigStore\``,
      required: true,
      aliases: ['sc'],
    }),
  };

  public async run(): Promise<void> {
    const store = this.getStoreInstanceByStoreFlag(this.flags.store);
    const set = new ConfigSet(this.flags.set);
    const schema = await this.getSchemaInstanceBySchemaFlag(this.flags.schema);

    await new DeleteCommand({
      store,
      set,
      schema,
    }).run();
    this.print(`Configs deleted successfully`, { symbol: 'success' });
  }
}
