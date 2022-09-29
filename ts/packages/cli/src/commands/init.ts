import { Flags } from '@oclif/core';
import fs from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import _ from 'lodash';
import { paramCase } from 'change-case';
import { CFGU, CfguType, CfguContents } from '@configu/ts';
import { extractConfigs } from '@configu/lib';
import { Cfgu } from '@configu/node';
import { BaseCommand } from '../base';
import { getPathBasename } from '../helpers/utils';

export default class Init extends BaseCommand {
  static description = `creates a config schema ${CFGU.EXT} file in the current working dir`;
  static examples = [
    '<%= config.bin %> <%= command.id %> --name "cli"',
    '<%= config.bin %> <%= command.id %> --dir "./src/cli" --name "cli"',
    '<%= config.bin %> <%= command.id %> --name "cli" --examples',
    '<%= config.bin %> <%= command.id %> --name "cli" --import "./src/.env" --defaults --types',
  ];

  static flags = {
    ...BaseCommand.flags,
    dir: Flags.string({
      description: `overrides the directory that will contain the new ${CFGU.EXT} file`,
      default: cwd(),
    }),
    name: Flags.string({
      description: `overrides the name for the new ${CFGU.EXT} file`,
      default: paramCase(getPathBasename()),
    }),
    force: Flags.boolean({
      char: 'f',
      description: `overrides the ${CFGU.EXT} file in case it already exists`,
      default: false,
    }),

    examples: Flags.boolean({
      exclusive: ['import'],
      description: `fills the new ${CFGU.EXT} file with a variety of detailed examples`,
      default: false,
    }),

    import: Flags.string({
      exclusive: ['examples'],
      description:
        'use this flag to import an existing .env file and create a cfgu file from it. Then push the newly created cfgu to create a Configu schema',
    }),
    defaults: Flags.boolean({
      dependsOn: ['import'],
      description:
        'use this flag to assign the values from your .env file as the default value for the keys that will be created in the cfgu file.',
    }),
    types: Flags.boolean({
      dependsOn: ['import'],
      description:
        'use this flag, so that Configu will infer the types of your keys from their values, and create the cfgu with those types. Otherwise all keys are created with the String type.',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    const hasOverrideName = flags.name !== getPathBasename();
    const fileName = hasOverrideName ? flags.name : getPathBasename(flags.dir);
    const fileNameWithExt = `${fileName}${CFGU.EXT}.${CfguType.Json}`;
    const filePath = path.resolve(flags.dir, fileNameWithExt);
    const cfgu = new Cfgu(filePath);

    let fileContentData: CfguContents = {};

    if (flags.examples) {
      fileContentData = CFGU.EXAMPLE;
    }

    if (flags.import) {
      const fileContent = await this.readFile(flags.import);
      const extractedConfigs = extractConfigs({
        filePath: flags.import,
        fileContent,
        options: { useValuesAsDefaults: flags.defaults, analyzeValuesTypes: flags.types },
      });
      fileContentData = _(extractedConfigs).keyBy('key').mapValues('schema').value();
    }

    const fileContent = JSON.stringify(fileContentData, null, 2);

    await fs.writeFile(filePath, fileContent, { flag: flags.force ? 'w' : 'wx' }); // * https://nodejs.org/api/fs.html#file-system-flags
    fileContentData = await cfgu.parse();

    const recordsCount = _.keys(fileContentData).length;
    this.log(`${filePath} generated with ${recordsCount} records`);
    if (flags.types) {
      this.log(`please review the result and validate the assigned types`);
    }
  }
}
