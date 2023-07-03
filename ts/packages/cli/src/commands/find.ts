import { Args, Flags } from '@oclif/core';
import path from 'path';
import { ConfigSchema } from '@configu/node';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { once } from 'events';
import _ from 'lodash';
import { TMPL } from '@configu/ts';
import FastGlob = require('fast-glob');
import { BaseCommand } from '../base';

export default class Find extends BaseCommand<typeof Find> {
  private ignoredFiles: Set<string> = new Set(['build', 'dist', 'node_modules']);

  static description = `Finding all config parameters and their usage in the source code based on CFGU files`;

  static examples = [
    {
      description: `Find all config parameters and their usage in current directory`,
      command: `<%= config.bin %> <%= command.id %>`,
    },
    {
      description: `Find all config parameters and their usage in specific directory from provided CFGU file`,
      command: `<%= config.bin %> <%= command.id %> <PATH_TO_SCAN> --cfgu <PATH_TO_CFGU>`,
    },
    {
      description: `Find all unused config parameters in specific directory`,
      command: `<%= config.bin %> <%= command.id %> <PATH_TO_SCAN> --unused`,
    },
  ];

  static args = {
    path: Args.directory({
      description: 'Path to source code',
      required: true,
      default: '.',
    }),
  };

  static flags = {
    cfgu: Flags.file({
      description: 'Path to a specific .cfgu file (default: all CFGU files in the source code)',
      required: false,
    }),
    unused: Flags.boolean({
      description: 'Only show unused parameters',
      required: false,
      default: false,
    }),
    'show-templates': Flags.boolean({
      description: 'Ignore parameters that are parts of templates and treat them as used parameters',
      required: false,
      default: false,
    }),
    ignore: Flags.string({
      description: 'Comma separated list of glob patterns to ignore. (ex. --ignore "*.xml,**/*.md")',
      required: false,
      default: '',
    }),
  };

  private async updateIgnoredFiles(projectPath: string) {
    this.ignoredFiles = new Set([...this.ignoredFiles, ...this.flags.ignore.split(',')]);
    const gitIgnores = FastGlob.sync([path.join(projectPath, '.gitignore')], {
      dot: true,
      ignore: [...this.ignoredFiles].map((dirName) => path.join(projectPath, `/**/${dirName}`)),
    });
    await Promise.all(
      gitIgnores.map((gitIgnore) =>
        this.processLineByLine(gitIgnore, (line, lineIndex) => {
          if (!line.startsWith('#') && !this.ignoredFiles.has(line)) this.ignoredFiles.add(line);
        }),
      ),
    );
  }

  private findCfgu(projectPath: string) {
    return FastGlob.sync([path.join(projectPath, '/**/*.cfgu.json')], {
      ignore: [...this.ignoredFiles].map((ignoreFile) => path.join(projectPath, `/**/${ignoreFile}`)),
    });
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

  private async find() {
    const projectPath = path.resolve(this.args.path);
    const unusedOnly = this.flags.unused;
    const showTemplateKeys = this.flags['show-templates'];
    await this.updateIgnoredFiles(projectPath);
    const cfguPaths = this.flags.cfgu ? [this.flags.cfgu] : this.findCfgu(projectPath);

    if (cfguPaths.length === 0)
      throw new Error(
        `no cfgu file found or provided. If you have another type of configuration file, run configu init --import=<CONFIG-FILE> --defaults to generate a cfgu from it`,
      );

    const keysFromCfgu = await Promise.all(
      cfguPaths.map(async (cfguFile) => {
        try {
          const schemaContents = await ConfigSchema.parse(new ConfigSchema(cfguFile));
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
      }),
    );

    const keysRegEx = _.mapValues(_.keyBy([...new Set(keysFromCfgu.flat())]), (key) => ({
      pattern: new RegExp(key, 'g'),
      count: 0,
    }));

    const files = FastGlob.sync([path.join(projectPath, '/**/*.*')], {
      dot: true,
      ignore: [...[...this.ignoredFiles].map((dirName) => path.join(projectPath, `/**/${dirName}`)), '/**/*.json'],
    });

    await Promise.all(
      files.map((file) =>
        this.processLineByLine(file, (line, lineIndex) => {
          Object.keys(keysRegEx).map(async (key) => {
            const keyRegEx = keysRegEx[key];
            if (keyRegEx) {
              const regEx = keyRegEx.pattern;
              const match = regEx.exec(line);
              if (line && match) {
                keyRegEx.count += 1;
                if (!unusedOnly)
                  this.log(`${file.replace(projectPath, '...')}:${lineIndex}:${match.index} [${regEx.source}]`);
              }
            }
          });
        }),
      ),
    );
    const unusedKeys = Object.keys(keysRegEx).filter((key) => keysRegEx[key]?.count === 0);
    if (unusedKeys.length > 0) this.log(`Unused configs found: ${unusedKeys.join(', ')}`);
    else if (unusedOnly) this.log('No unused configs found');
  }

  public async run(): Promise<void> {
    try {
      await this.find();
    } catch (error) {
      this.log(`ERROR: ${error.message}`);
    }
  }
}
