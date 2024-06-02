import fs from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import { Flags } from '@oclif/core';
import _ from 'lodash';
import { paramCase, constantCase } from 'change-case';
import { type Cfgu } from '@configu/ts';
import { extractConfigs, GET_STARTED, FOO } from '@configu/lib';
import { ConfigSchema } from '@configu/node';
import { BaseCommand } from '../base';
import { getPathBasename, readFile } from '../helpers';

export default class Init extends BaseCommand<typeof Init> {
  static description = `Create a \`ConfigSchema\` .cfgu file in the current working dir`;
  static examples = [
    {
      description: `Create a new .cfgu file in the current directory with the default name (current directory name in parameter-case)`,
      command: `<%= config.bin %> <%= command.id %>`,
    },
    {
      description: `Create a new .cfgu file in the current directory with a specific name (my-project.cfgu)`,
      command: `<%= config.bin %> <%= command.id %> --name 'my-project'`,
    },
    {
      description: `Create a new .cfgu file in a specific directory (./config) with a specific name (my-project.cfgu)`,
      command: `<%= config.bin %> <%= command.id %> --dir './config' --name 'my-project'`,
    },
    {
      description: `Import an existing flat .json file and create a new .cfgu file from it's records`,
      command: `<%= config.bin %> <%= command.id %> --import './config.json'`,
    },
    {
      description: `Import an existing .env file and create a new .cfgu file from it's records, assigning the values as the default value for the keys in the .cfgu file and inferring the Cfgu type of the values and assigning them to the keys in the .cfgu file`,
      command: `<%= config.bin %> <%= command.id %> --import './.env' --defaults --types`,
    },
    {
      description: `Create a new get-started.cfgu file filled with a variety of pre-made, detailed record examples`,
      command: `<%= config.bin %> <%= command.id %> --get-started`,
    },
  ];

  static flags = {
    ...BaseCommand.flags,
    name: Flags.string({
      description: `Set the name of the new .cfgu file. The default is the current directory name in parameter-case`,
      aliases: ['id', 'uid'],
      default: paramCase(getPathBasename(cwd())),
    }),
    dir: Flags.string({
      description: `Set the directory that will contain the new .cfgu file. The default is the current directory`,
      aliases: ['cwd'],
      default: cwd(),
    }),
    force: Flags.boolean({
      description: `Override the .cfgu file in case it already exists`,
      char: 'f',
      default: false,
    }),

    start: Flags.boolean({
      description: `Fills the new .cfgu file with a get-started example`,
      exclusive: ['import', 'example'],
      aliases: ['get-started', 'quick-start', 'getting-started', 'hello-world'],
      default: false,
    }),
    example: Flags.boolean({
      description: `Fills the new .cfgu file with a variety of detailed examples`,
      exclusive: ['import', 'start'],
      aliases: ['examples', 'foo', 'foo-bar', 'foo-bar-baz'],
      default: false,
    }),

    import: Flags.string({
      description: `Import an existing .env or flat .json file and create a new .cfgu file from its records`,
      exclusive: ['start', 'example'],
    }),
    defaults: Flags.boolean({
      description: `Assign the values from the imported file as the default value for the keys that will be created in the .cfgu file`,
      dependsOn: ['import'],
    }),
    types: Flags.boolean({
      description: `Infer the Cfgu type of the values from the imported file and assign them to the keys that will be created in the .cfgu file. The default is String`,
      dependsOn: ['import'],
    }),
  };

  async getSchemaName() {
    const isOverrideName = this.flags.name !== Init.flags.name.default;
    if (isOverrideName) {
      return this.flags.name;
    }

    if (this.flags.start) {
      return 'start';
    }
    if (this.flags.example) {
      return 'example';
    }

    return paramCase(getPathBasename(this.flags.dir));
  }

  async getSchemaContents(): Promise<{ [key: string]: Cfgu }> {
    if (this.flags.start) {
      return GET_STARTED;
    }
    if (this.flags.example) {
      return FOO;
    }

    if (this.flags.import) {
      const fileContent = await readFile(this.flags.import);
      const extractedConfigs = extractConfigs({
        filePath: this.flags.import,
        fileContent,
        options: { useValuesAsDefaults: this.flags.defaults, analyzeValuesTypes: this.flags.types },
      });
      return _.mapValues(extractedConfigs, 'cfgu');
    }

    return {
      [constantCase(`some key`)]: {
        type: 'String',
        description: `For more information about \`ConfigSchema\` and the \`Cfgu\` format, visit https://configu.com/docs/config-schema/`,
        default: paramCase('some value'),
        required: false,
      },
    };
  }

  public async run(): Promise<void> {
    const schemaName = await this.getSchemaName();
    const schemaContents = await this.getSchemaContents();
    const schema = new ConfigSchema(schemaName, schemaContents);

    const fileName = `${schemaName}.${ConfigSchema.CFGU.NAME}.json`;
    const filePath = path.resolve(this.flags.dir, fileName);
    const fileContent = JSON.stringify(schemaContents, null, 2);
    await fs.writeFile(filePath, fileContent, { flag: this.flags.force ? 'w' : 'wx' }); // * https://nodejs.org/api/fs.html#file-system-flags

    const recordsCount = _.keys(schemaContents).length;
    this.print(`${filePath} generated with ${recordsCount} records`, { symbol: 'success' });
    if (this.flags.types) {
      this.print(`Please review the result and validate the assigned types`);
    }
  }
}
