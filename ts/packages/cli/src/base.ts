import { Config, Command, Flags, Interfaces, Errors, ux } from '@oclif/core';
import fs from 'fs/promises';
import path from 'path';
import _ from 'lodash';
import axios from 'axios';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import ci from 'ci-info';
import inquirer from 'inquirer';
import inquirerPrompt from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', inquirerPrompt);

type BaseConfig = Config & { ci: typeof ci; configFile: string; configData: { stores?: Record<string, string> } };

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<(typeof BaseCommand)['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  static enableJsonFlag = false;
  static baseFlags = {};

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  public config: BaseConfig;
  public log(text: string, symbol: keyof typeof logSymbols = 'info', stdout: 'stdout' | 'stderr' = 'stderr') {
    const prettyText = stdout === 'stderr' ? chalk.dim(`${logSymbols[symbol]} ${text}\n`) : text;
    process[stdout].write(prettyText);
  }

  public start(text: string) {
    ux.action.start(chalk.dim(text));
  }

  public stop(code = 0, text = '') {
    const mark = code !== 0 ? chalk.red(logSymbols.error) : chalk.green(logSymbols.success);
    const defaultText = code !== 0 ? 'failed' : 'succeed';
    ux.action.stop(` ${mark} ${chalk.dim(text ?? defaultText)}`);
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

  async writeConfigData() {
    const rawConfigData = JSON.stringify(this.config.configData);
    await fs.writeFile(this.config.configFile, rawConfigData);
  }

  public async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });
    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;

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

  protected async catch(error: Error & { exitCode?: number }): Promise<any> {
    if (!axios.isAxiosError(error)) {
      return super.catch(error);
    }
    if (error.response?.data?.message) {
      return super.catch(new Errors.CLIError(error.response.data.message));
    }
    if (error?.request) {
      return super.catch(
        new Errors.CLIError(
          "There seems to be a problem connecting to Configu's servers. Please check your network connection and try again.",
        ),
      );
    }
    return super.catch(new Errors.CLIError(error?.message));
  }

  // protected async finally(error: Error | undefined): Promise<any> {
  //   // called after run and catch regardless of whether or not the command errored
  //   return super.finally(error);
  // }
}
