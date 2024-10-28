import fs from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { ConfigSchema, ConfigSchemaKeys } from '@configu/sdk';
import _ from 'lodash';
import { paramCase, constantCase } from 'change-case';
import { readFile } from '@configu/common';
import { BaseCommand } from './base';
import { extractConfigs, getPathBasename } from '../helpers';

export const GET_STARTED: ConfigSchemaKeys = {
  GREETING: {
    pattern: '^(hello|hey|welcome|hola|salute|bonjour|shalom|marhabaan)$',
    default: 'hello',
  },
  SUBJECT: { default: 'world' },
  MESSAGE: {
    // template: '{{GREETING}}, {{SUBJECT}}!',
    description: 'Generates a full greeting message',
  },
};

export const FOO: ConfigSchemaKeys = {
  FOO: { default: 'foo', description: 'string example variable' },
  BAR: { pattern: '^(foo|bar|baz)$', description: 'regex example variable' },
  BAZ: {
    // template: '{{FOO}} - {{BAR}}',
    description: 'template example variable',
  },
};

const NAME_FLAG_DEFAULT = paramCase(getPathBasename(cwd()));
const DIR_FLAG_DEFAULT = cwd();

export class InitCommand extends BaseCommand {
  static override paths = [['init']];

  static override usage = Command.Usage({
    description: `Create a \`ConfigSchema\` .cfgu file in the current working dir`,
  });

  name = Option.String('--name,--id,--uid', {
    description: `Set the name of the new .cfgu file. The default is the current directory name in parameter-case`,
  });

  dir = Option.String('--dir,--cwd', {
    description: `Set the directory that will contain the new .cfgu file. The default is the current directory`,
  });

  force = Option.Boolean('--force,--f', {
    description: `Override the .cfgu file in case it already exists`,
  });

  start = Option.Boolean('--start,--get-started,--quick-start,--getting-started,--hello-world', {
    description: `Generate a 'Getting Started' .cfgu file`,
  });

  example = Option.Boolean('--example,--examples,--foo,--foo-bar,--foo-bar-baz', {
    description: `Fills the new .cfgu file with a variety of detailed examples`,
  });

  import = Option.String('--import', {
    description: `Import an existing .env or flat .json file and create a new .cfgu file from its records`,
  });

  defaults = Option.Boolean('--defaults', {
    description: `Assign the values from the imported file as the default value for the keys that will be created in the .cfgu file`,
  });

  static override schema = [
    t.hasMutuallyExclusiveKeys(['import', 'start', 'example'], { missingIf: 'undefined' }),
    t.hasKeyRelationship('defaults', t.KeyRelationship.Requires, ['import'], { missingIf: 'undefined' }),
  ];

  async getSchemaName() {
    const isOverrideName = this.name !== NAME_FLAG_DEFAULT;
    if (isOverrideName) {
      return this.name ?? NAME_FLAG_DEFAULT;
    }

    if (this.start) {
      return 'start';
    }
    if (this.example) {
      return 'example';
    }

    return paramCase(getPathBasename(this.dir ?? DIR_FLAG_DEFAULT));
  }

  async getSchemaContents(): Promise<ConfigSchemaKeys> {
    if (this.start) {
      return GET_STARTED;
    }
    if (this.example) {
      return FOO;
    }

    if (this.import) {
      const fileContent = await readFile(this.import);
      const extractedConfigs = extractConfigs({
        filePath: this.import,
        fileContent,
        options: { useValuesAsDefaults: this.defaults },
      });
      return _.mapValues(extractedConfigs, 'cfgu');
    }

    return {
      [constantCase(`some key`)]: {
        description: `For more information about \`ConfigSchema\` and the \`Cfgu\` format, visit https://configu.com/docs/config-schema/`,
        default: paramCase('some value'),
        required: false,
      },
    };
  }

  async execute() {
    const schemaName = await this.getSchemaName();
    const schemaContents = await this.getSchemaContents();
    const schema = new ConfigSchema(schemaContents);

    const fileName = `${schemaName}.cfgu.json`;
    const filePath = path.resolve(this.dir ?? DIR_FLAG_DEFAULT, fileName);
    const fileContent = JSON.stringify({ keys: schemaContents }, null, 2);
    await fs.writeFile(filePath, fileContent, { flag: this.force ? 'w' : 'wx' }); // * https://nodejs.org/api/fs.html#file-system-flags

    const recordsCount = _.keys(schemaContents).length;
    process.stdout.write(`${filePath} generated with ${recordsCount} records`);
  }
}
