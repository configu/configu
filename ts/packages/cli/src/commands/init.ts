import { Flags } from '@oclif/core';
import fs from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import _ from 'lodash';
import { paramCase } from 'change-case';
import { ConfigSchemaType, Cfgu, CfguType } from '@configu/ts';
import { extractConfigs } from '@configu/lib';
import { ConfigSchema } from '@configu/node';
import { BaseCommand } from '../base';
import { getPathBasename } from '../helpers/utils';

const POPULATED_SCHEMA: Record<string, { [key: string]: Cfgu }> = {
  GET_STARTED: {
    GREETING: { type: CfguType.RegEx, pattern: '^(hello|hey|welcome|salute|bonjour)$', default: 'hello' },
    SUBJECT: { type: CfguType.String, default: 'world' },
    MESSAGE: {
      type: CfguType.String,
      template: '{{GREETING}}, {{SUBJECT}}!',
      description: 'Generates a full greeting message',
    },
  },
  EXAMPLE: {
    FOO: { type: CfguType.String, default: 'foo', description: 'string example variable' },
    BAR: { type: CfguType.RegEx, pattern: '^(foo|bar|baz)$', description: 'regex example variable' },
    BAZ: { type: CfguType.String, template: '{{FOO}} - {{BAR}}', description: 'template example variable' },
  },
};

export default class Init extends BaseCommand {
  static description = `creates a config schema ${ConfigSchema.CFGU.EXT} file in the current working dir`;
  static examples = [
    '<%= config.bin %> <%= command.id %> --uid "cli"',
    '<%= config.bin %> <%= command.id %> --uid "cli" --dir "./src/cli"',
    '<%= config.bin %> <%= command.id %> --uid "cli" --import "./src/.env" --defaults --types',
    '<%= config.bin %> <%= command.id %> --example',
  ];

  static flags = {
    ...BaseCommand.flags,
    uid: Flags.string({
      description: `overrides the name for the new ${ConfigSchema.CFGU.EXT} file`,
      aliases: ['id', 'unique-identifier', 'unique-id', 'name'],
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
      aliases: ['quick-start', 'getting-started'],
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

  async getSchemaUid() {
    const { flags } = await this.parse(Init);

    if (flags['get-started']) {
      return 'get-started';
    }
    if (flags.example) {
      return 'example';
    }

    const hasOverrideUid = flags.uid !== Init.flags.uid.default;
    if (hasOverrideUid) {
      return flags.uid;
    }
    return getPathBasename(flags.dir);
  }

  async getSchemaContents(): Promise<{ [key: string]: Cfgu }> {
    const { flags } = await this.parse(Init);

    if (flags['get-started']) {
      return POPULATED_SCHEMA.GET_STARTED;
    }
    if (flags.example) {
      return POPULATED_SCHEMA.EXAMPLE;
    }

    if (flags.import) {
      const fileContent = await this.readFile(flags.import);
      const extractedConfigs = extractConfigs({
        filePath: flags.import,
        fileContent,
        options: { useValuesAsDefaults: flags.defaults, analyzeValuesTypes: flags.types },
      });
      return _(extractedConfigs).keyBy('key').mapValues('cfgu').value();
    }

    return {};
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    const fileName = await this.getSchemaUid();
    const fileNameWithExt = `${fileName}${ConfigSchema.CFGU.EXT}.${ConfigSchemaType.JSON}`;
    const filePath = path.resolve(flags.dir, fileNameWithExt);
    const fileContentData = await this.getSchemaContents();
    const fileContent = JSON.stringify(fileContentData, null, 2);

    const schema = new ConfigSchema(filePath);
    await fs.writeFile(filePath, fileContent, { flag: flags.force ? 'w' : 'wx' }); // * https://nodejs.org/api/fs.html#file-system-flags
    await ConfigSchema.parse(schema);

    const recordsCount = _.keys(fileContentData).length;
    this.log(`${filePath} generated with ${recordsCount} records`);
    if (flags.types) {
      this.log(`please review the result and validate the assigned types`);
    }
  }
}
