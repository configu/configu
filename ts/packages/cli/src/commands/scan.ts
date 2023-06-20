import { Flags } from '@oclif/core';
import path from 'path';
import * as fg from 'fast-glob';
import { ConfigSchema } from '@configu/node';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { once } from 'events';
import { BaseCommand } from '../base';

export default class Scan extends BaseCommand<typeof Scan> {
  private readonly _ignoreFiles: string[] = ['build', 'dist', 'node_modules']; // TODO: read .gitignore add to here

  static description = `Scan source code for cfgu usage`;

  static examples = [
    {
      description: `Scan for .cfgu.json files and usage in current directory`,
      command: `<%= config.bin %> <%= command.id %>`,
    },
    {
      description: `Scan for .cfgu.json files and usage in a specific directory`,
      command: `<%= config.bin %> <%= command.id %> --path <path>`,
    },
  ];

  static flags = {
    path: Flags.file({
      description: 'path for source code to scan for cfgu',
      aliases: ['p'],
      required: false,
      default: '.',
    }),
  };

  private _findCfgu(projectPath: string) {
    return fg.sync([path.join(projectPath, '/**/*.cfgu.json')], {
      ignore: this._ignoreFiles.map((dirName) => path.join(projectPath, `/**/${dirName}`)),
    });
  }

  private async _processLineByLine(filePath: string, onLine: (line: string, lineIndex: number) => any): Promise<void> {
    const readLine = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Number.POSITIVE_INFINITY,
    });

    let lineIndex = 1;
    readLine.on('line', (line) => {
      onLine(line, lineIndex);
      lineIndex += 1;
    });
    await once(readLine, 'close');
  }

  private async _scan() {
    const projectPath = path.resolve(this.flags.path);
    const cfguPaths = this._findCfgu(projectPath);
    if (cfguPaths.length === 0) throw new Error(`No .cfgu.json files found in ${projectPath}`);
    cfguPaths.map(async (cfguFile) => {
      try {
        const schemaContents = await ConfigSchema.parse(new ConfigSchema(cfguFile));
        const keys = Object.keys(schemaContents);
        const { dir } = path.parse(cfguFile);
        const files = fg.sync([path.join(dir, '/**/*.*')], {
          dot: true,
          ignore: [...this._ignoreFiles.map((dirName) => path.join(dir, `/**/${dirName}`)), cfguFile, '/**/*.json'],
        });
        files.map((file) =>
          this._processLineByLine(file, (line, lineIndex) => {
            keys.map(async (key) => {
              const regEx = new RegExp(key, 'g');
              const match = regEx.exec(line);
              if (line && match) {
                this.log(`${file.replace(projectPath, '...')}:${lineIndex}:${match.index} [${key}]`);
              }
            });
          }),
        );
      } catch (error) {
        this.log(`${error.message}`);
      }
    });
  }

  public async run(): Promise<void> {
    try {
      await this._scan();
    } catch (error) {
      this.log(`${error.message}`);
    }
  }
}
