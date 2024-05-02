import path from 'path';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { once } from 'events';
import { Flags } from '@oclif/core';
import _ from 'lodash';
import { TMPL } from '@configu/ts';
import FastGlob = require('fast-glob');
import { BaseCommand } from '../base';

export default class Find extends BaseCommand<typeof Find> {
  static description = `Finding all config parameters and their usage in the source code based on CFGU files`;

  static examples = [
    {
      description: `Find all config parameters and their usage in current directory`,
      command: `<%= config.bin %> <%= command.id %>`,
    },
    {
      description: `Find all config parameters and their usage in specific directory from provided CFGU file`,
      command: `<%= config.bin %> <%= command.id %> --dir <PATH_TO_SCAN> --include <PATH_TO_CFGU>`,
    },
    {
      description: `Find all unused config parameters in specific directory`,
      command: `<%= config.bin %> <%= command.id %> --dir <PATH_TO_SCAN> --unused`,
    },
  ];

  static flags = {
    dir: Flags.directory({
      description: 'Path to source code',
      required: true,
      default: '.',
    }),
    include: Flags.file({
      description: 'Path to a specific .cfgu file (default: all CFGU files in the source code)',
      required: false,
      multiple: true,
      default: [],
    }),
    exclude: Flags.file({
      description: 'Glob pattern to ignore',
      required: false,
      multiple: true,
      default: [],
    }),
    unused: Flags.boolean({
      description: 'Only show unused parameters',
      required: false,
      default: false,
    }),
    templates: Flags.boolean({
      description: '[default: false] Show parameters that are parts of templates and treat them as used parameters',
      required: false,
      default: false,
      allowNo: true,
    }),
  };

  private async updateIgnoredFiles(projectPath: string) {
    const ignoredFiles = new Set(['build', 'dist', 'node_modules', ...(this.flags?.exclude ?? [])]);
    const gitIgnores = FastGlob.sync([path.join(projectPath, '.gitignore')], {
      dot: true,
      ignore: [...ignoredFiles].map((dirName) => path.join(projectPath, `/**/${dirName}`)),
    });
    const gitIgnorePromises = gitIgnores.map((gitIgnore) =>
      this.processLineByLine(gitIgnore, (line, lineIndex) => {
        if (!line.startsWith('#') && !ignoredFiles.has(line)) ignoredFiles.add(line);
      }),
    );
    await Promise.all(gitIgnorePromises);
    return ignoredFiles;
  }

  private async processLineByLine(filePath: string, onLine: (line: string, lineIndex: number) => any): Promise<any[]> {
    const readLine = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Number.POSITIVE_INFINITY,
    });
    const result: any[] = [];
    let lineIndex = 1;
    readLine.on('line', (line) => {
      const lineResult = onLine(line, lineIndex);
      if (lineResult) result.push(lineResult);
      lineIndex += 1;
    });
    await once(readLine, 'close');
    return result;
  }

  public async run(): Promise<void> {
    const findInDirectory = path.resolve(this.flags.dir);
    const showUnusedOnly = this.flags.unused;
    const showTemplateKeys = this.flags.templates;
    const ignoredFiles = await this.updateIgnoredFiles(findInDirectory);
    const cfguPaths = !_.isEmpty(this.flags.include)
      ? (this.flags.include as string[])
      : FastGlob.sync([path.join(findInDirectory, '/**/*.cfgu.json')], {
          ignore: [...ignoredFiles].map((ignoreFile) => path.join(findInDirectory, `/**/${ignoreFile}`)),
        });

    if (cfguPaths.length === 0)
      throw new Error(
        `no cfgu file found or provided. If you have another type of configuration file, run configu init --import=<CONFIG-FILE> --defaults to generate a cfgu from it`,
      );

    const keysFromCfguPromises = cfguPaths.map(async (cfguFile) => {
      try {
        const schema = await this.getSchemaInstanceBySchemaFlag(cfguFile);
        const schemaContents = schema.contents;
        if (!showTemplateKeys) {
          const schemaEntries = Object.entries(schemaContents);
          const ignoredKeys = new Set(
            schemaEntries
              .filter(([key, cfgu]) => !!cfgu.template)
              .flatMap(([key, cfgu]) => {
                return TMPL.parse(cfgu.template as string)
                  .filter((templateSpan) => templateSpan.type === 'name')
                  .map((templateSpan) => templateSpan.key);
              }),
          );
          return schemaEntries.filter(([key, cfgu]) => !ignoredKeys.has(key)).map(([key, cfgu]) => key);
        }
        return Object.keys(schemaContents);
      } catch {
        return [];
      }
    });
    const keysFromCfgu = await Promise.all(keysFromCfguPromises);

    const keysRegEx = _.mapValues(_.keyBy([...new Set(keysFromCfgu.flat())]), (key) => ({
      pattern: new RegExp(key, 'g'),
      count: 0,
    }));

    const files = FastGlob.sync([path.join(findInDirectory, '/**/*.*')], {
      dot: true,
      ignore: [...[...ignoredFiles].map((dirName) => path.join(findInDirectory, `/**/${dirName}`)), '/**/*.json'],
    });
    const findInFilesPromises = files.map((file) =>
      this.processLineByLine(file, (line, lineIndex) => {
        Object.keys(keysRegEx).map(async (key) => {
          const keyRegEx = keysRegEx[key];
          if (keyRegEx) {
            const regEx = keyRegEx.pattern;
            const match = regEx.exec(line);
            if (line && match) {
              keyRegEx.count += 1;
              if (!showUnusedOnly)
                this.print(`${file.replace(findInDirectory, '...')}:${lineIndex}:${match.index} [${regEx.source}]`);
            }
          }
        });
      }),
    );
    await Promise.all(findInFilesPromises);

    const unusedKeys = Object.keys(keysRegEx).filter((key) => keysRegEx[key]?.count === 0);
    if (unusedKeys.length > 0) this.print(`Unused configs found: ${unusedKeys.join(', ')}`);
    else if (showUnusedOnly) this.print('No unused configs found');
  }
}
