import { Flags } from '@oclif/core';
import _ from 'lodash';
import { ConfigSet, UpsertCommand } from '@configu/node';
import { extractConfigs } from '@configu/lib';
import { BaseCommand } from '../base';
import { readFile } from '../helpers';

export default class Upsert extends BaseCommand<typeof Upsert> {
  static description = `Create, update or delete \`Configs\` from a \`ConfigStore\``;

  static examples = [
    {
      description: `Upsert a \`Config\` to the 'root' \`ConfigSet\` of a 'configu' \`ConfigStore\` using a \`ConfigSchema\` file at './config/schema.cfgu'`,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --set '' --schema './config/schema.cfgu.json' --config 'key=value'`,
    },
    {
      description: `Upsert multiple \`Configs\` to a \`ConfigSet\` called 'prod' within a 'configu' \`ConfigStore\` using a \`ConfigSchema\` file at './config/schema.cfgu.json'`,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --set 'prod' --schema './config/schema.cfgu.json' --config 'key1=value1' -c 'key2=value2' -c 'key3=value3'`,
    },
    {
      description: `Delete a \`Config\` from a \`ConfigSet\` called 'prod' within a 'configu' \`ConfigStore\` using a \`ConfigSchema\` file at './config/schema.cfgu.json'`,
      command: `<%= config.bin %> <%= command.id %> --store 'configu' --set 'prod' --schema './config/schema.cfgu.json' --config 'keyToDelete='`,
    },
    {
      description: `Upsert a \`Config\` to a \`ConfigSet\` called 'prod' within 'hashicorp-vault' \`ConfigStore\` using a \`ConfigSchema\` file at './config/schema.cfgu.json'`,
      command: `<%= config.bin %> <%= command.id %> --store 'hashicorp-vault' --set 'prod' --schema './config/schema.cfgu.json' --config 'secretKey=secretValue'`,
    },
  ];

  static flags = {
    store: Flags.string({
      description: `\`ConfigStore\` (configs data-source) to upsert \`Configs\` to`,
      required: true,
      aliases: ['st'],
    }),
    set: Flags.string({
      description: `\`ConfigSet\` (config-values context) to assign the upserted \`Configs\`. Use an empty string for the root set`,
      required: true,
      aliases: ['se'],
    }),
    schema: Flags.string({
      description: `\`ConfigSchema\` (config-keys declaration) path/to/[schema].cfgu.json file to operate the upsert against. The keys declared in the \`ConfigSchema\` can be assigned a value in the \`ConfigSet\` that will be upserted as a \`Config\` to the \`ConfigStore\``,
      required: true,
      aliases: ['sc'],
    }),
    config: Flags.string({
      description: `'key=value' pairs to upsert. Use an empty value to delete a \`Config\``,
      exclusive: ['import'],
      multiple: true,
      char: 'c',
    }),
    import: Flags.string({
      description: `Import an existing .env or flat .json file and create \`Configs\` from its records`,
      exclusive: ['config'],
    }),
  };

  public async run(): Promise<void> {
    const store = this.getStoreInstanceByStoreFlag(this.flags.store);
    const set = new ConfigSet(this.flags.set);
    const schema = await this.getSchemaInstanceBySchemaFlag(this.flags.schema);
    const pipe = await this.readPreviousEvalCommandReturn();

    let configs = this.reduceConfigFlag(this.flags.config);
    if (this.flags.import) {
      const fileContent = await readFile(this.flags.import);
      const extractedConfigs = extractConfigs({
        filePath: this.flags.import,
        fileContent,
      });
      configs = _(extractedConfigs)
        .pickBy((value, key) => {
          const cfgu = schema.contents[key];
          return cfgu && !cfgu.template && value.value;
        })
        .mapValues((value, key) => value.value)
        .value();
    }

    await new UpsertCommand({
      store,
      set,
      schema,
      configs,
      pipe,
    }).run();
    this.print(`Configs upserted successfully`, { symbol: 'success' });
  }
}
