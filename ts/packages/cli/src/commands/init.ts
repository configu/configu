import { Flags } from '@oclif/core';
import fs from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import _ from 'lodash';
import { paramCase } from 'change-case';
import { Cfgu } from '@configu/ts';
import { extractConfigs } from '@configu/lib';
import { ConfigSchema } from '@configu/node';
import { BaseCommand } from '../base';
import { getPathBasename } from '../helpers';

const POPULATED_SCHEMA: Record<'GET_STARTED' | 'EXAMPLE', { [key: string]: Cfgu }> = {
  GET_STARTED: {
    GREETING: {
      type: 'RegEx',
      pattern: '^(hello|hey|welcome|hola|salute|bonjour|shalom|marhabaan)$',
      default: 'hello',
    },
    SUBJECT: { type: 'String', default: 'world' },
    MESSAGE: {
      type: 'String',
      template: '{{GREETING}}, {{SUBJECT}}!',
      description: 'Generates a full greeting message',
    },
  },
  EXAMPLE: {
    FOO: { type: 'String', default: 'foo', description: 'string example variable' },
    BAR: { type: 'RegEx', pattern: '^(foo|bar|baz)$', description: 'regex example variable' },
    BAZ: { type: 'String', template: '{{FOO}} - {{BAR}}', description: 'template example variable' },
  },
};

export default class Init extends BaseCommand<typeof Init> {
  static description = `creates a config schema ${ConfigSchema.CFGU.EXT} file in the current working dir`;
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --name "cli" --dir "./src/cli"',
    '<%= config.bin %> <%= command.id %> --import "./src/.env" --defaults --types',
    '<%= config.bin %> <%= command.id %> --example',
  ];

  static flags = {
    ...BaseCommand.flags,
    name: Flags.string({
      description: `overrides the name for the new ${ConfigSchema.CFGU.EXT} file`,
      aliases: ['id', 'uid', 'unique-identifier', 'unique-id'],
      default: paramCase(getPathBasename()),
    }),
    dir: Flags.string({
      description: `overrides the directory that will contain the new ${ConfigSchema.CFGU.EXT} file`,
      aliases: ['cwd', 'working-directory'],
      default: cwd(),
    }),
    force: Flags.boolean({
      description: `overrides the ${ConfigSchema.CFGU.EXT} file in case it already exists`,
      char: 'f',
      default: false,
    }),

    'get-started': Flags.boolean({
      description: `fills the new ${ConfigSchema.CFGU.EXT} file with a get-started example`,
      exclusive: ['uid', 'import', 'example'],
      aliases: ['quick-start', 'getting-started', 'hello-world'],
      default: false,
    }),
    example: Flags.boolean({
      description: `fills the new ${ConfigSchema.CFGU.EXT} file with a variety of detailed examples`,
      exclusive: ['uid', 'import', 'get-started'],
      aliases: ['examples', 'foo'],
      default: false,
    }),

    import: Flags.string({
      description: `use this flag to import an existing .env file and create a ${ConfigSchema.CFGU.EXT} file from it. Then push the newly created ${ConfigSchema.CFGU.NAME} to create a Configu schema`,
      exclusive: ['example', 'get-started'],
    }),
    defaults: Flags.boolean({
      description: `use this flag to assign the values from your .env file as the default value for the keys that will be created in the ${ConfigSchema.CFGU.EXT} file.`,
      dependsOn: ['import'],
    }),
    types: Flags.boolean({
      description: `use this flag, so that Configu will infer the types of your keys from their values, and create the ${ConfigSchema.CFGU.NAME} with those types. Otherwise all keys are created with the String type.`,
      dependsOn: ['import'],
    }),
  };

  async getSchemaName() {
    if (this.flags['get-started']) {
      return 'get-started';
    }
    if (this.flags.example) {
      return 'example';
    }

    const isOverrideName = this.flags.name !== Init.flags.name.default;
    if (isOverrideName) {
      return this.flags.name;
    }
    return getPathBasename(this.flags.dir);
  }

  async getSchemaContents(): Promise<{ [key: string]: Cfgu }> {
    if (this.flags['get-started']) {
      return POPULATED_SCHEMA.GET_STARTED;
    }
    if (this.flags.example) {
      return POPULATED_SCHEMA.EXAMPLE;
    }

    if (this.flags.import) {
      const fileContent = await this.readFile(this.flags.import);
      const extractedConfigs = extractConfigs({
        filePath: this.flags.import,
        fileContent,
        options: { useValuesAsDefaults: this.flags.defaults, analyzeValuesTypes: this.flags.types },
      });
      return _.mapValues(extractedConfigs, 'cfgu');
    }

    return {};
  }

  public async run(): Promise<void> {
    const fileName = await this.getSchemaName();
    const fileNameWithExt = `${fileName}${ConfigSchema.CFGU.EXT}.json`;
    const filePath = path.resolve(this.flags.dir, fileNameWithExt);
    const fileContentData = await this.getSchemaContents();
    const fileContent = JSON.stringify(fileContentData, null, 2);

    await fs.writeFile(filePath, fileContent, { flag: this.flags.force ? 'w' : 'wx' }); // * https://nodejs.org/api/fs.html#file-system-flags

    const schema = new ConfigSchema(filePath);
    await ConfigSchema.parse(schema);

    const recordsCount = _.keys(fileContentData).length;
    this.log(`${filePath} generated with ${recordsCount} records`, 'success');
    if (this.flags.types) {
      this.log(`please review the result and validate the assigned types`);
    }
  }
}
