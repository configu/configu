import { Config, Command, CliUx } from '@oclif/core';
import fs from 'fs/promises';
import path from 'path';
import _ from 'lodash';
import chalk from 'chalk';
import ci from 'ci-info';

type BaseConfig = Config & { ci: typeof ci; configFile: string; configData: { stores?: Record<string, string> } };

export abstract class BaseCommand extends Command {
  static enableJsonFlag = false;

  public config: BaseConfig;
  public log(text = '', stdout: 'stdout' | 'stderr' = 'stderr') {
    const finalText = stdout === 'stderr' ? chalk.dim(text) : text;
    process[stdout].write(`${finalText}\n`);
  }

  public start(text: string) {
    CliUx.ux.action.start(chalk.dim(text));
  }

  public stop(code = 0, text = '') {
    const mark = code !== 0 ? chalk.red('✕') : chalk.green('✓');
    const defaultText = code !== 0 ? 'failed' : 'succeed';
    CliUx.ux.action.stop(` ${mark} ${chalk.dim(text ?? defaultText)}`);
  }

  async readFile(filePath: string, throwIfEmpty: string | boolean = false) {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, { encoding: 'utf8' });

      if (throwIfEmpty && _.isEmpty(content)) {
        const errorMessage = typeof throwIfEmpty !== 'boolean' ? throwIfEmpty : 'file is empty';
        throw new Error(errorMessage);
      }

      return content;
    } catch (error) {
      // * https://nodejs.org/api/errors.html#errors_common_system_errors
      if (error.code === 'ENOENT') {
        throw new Error('no such file or directory');
      }
      if (error.code === 'EISDIR') {
        throw new Error('expected a file, but the given path was a directory');
      }

      throw error;
    }
  }

  async init() {
    this.config.ci = ci;
    this.config.configFile = path.join(this.config.configDir, 'config.json');

    try {
      await fs.mkdir(this.config.configDir, { recursive: true });
      await fs.mkdir(this.config.cacheDir, { recursive: true });
    } catch (error) {
      throw new Error(`fail to initialize ${this.config.name} cli`);
    }

    try {
      const rawConfigData = await this.readFile(this.config.configFile, true);
      const configData = JSON.parse(rawConfigData);
      this.config.configData = configData;
    } catch (error) {
      this.config.configData = {};
    }
  }
}
