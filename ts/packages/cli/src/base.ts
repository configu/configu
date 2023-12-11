import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { type Config, Command, type Flags, type Interfaces, Errors, ux } from '@oclif/core';
import _ from 'lodash';
import { cosmiconfig } from 'cosmiconfig';
import axios from 'axios';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import ci from 'ci-info';
import { type EvalCommandReturn, type ConfiguConfigStore, TMPL, ConfigSchema, ConfigError } from '@configu/ts';
import { constructStore, getPathBasename, readFile, readStdin, loadJSON, loadYAML } from './helpers';

type BaseConfig = Config & {
  ci: typeof ci;
  UNICODE_NULL: '\u0000';
  configu: {
    file: string; // $HOME/.config/configu/config.json
    data: ConstructorParameters<typeof ConfiguConfigStore>['0'] | Record<string, never>;
  };
  cli: {
    file?: string; // .configu file
    data: Partial<{
      stores: Record<string, { type: string; configuration: Record<string, any> }>;
      scripts: Record<string, string>;
    }>;
  };
};

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<(typeof BaseCommand)['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  static enableJsonFlag = false;
  static baseFlags = {};

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  public config: BaseConfig;

  log = this.print;
  logToStderr = this.print;

  public print(
    text: string,
    options: {
      symbol?: keyof typeof logSymbols;
      stdout?: 'stdout' | 'stderr';
      eol?: boolean;
    } = {},
  ) {
    const { symbol = 'info', stdout = 'stderr' } = options;
    let { eol = false } = options;

    let decoratedText = text;
    if (stdout === 'stderr') {
      decoratedText = chalk.dim(`${logSymbols[symbol]} ${text}`);
      eol = true;
    }
    if (eol) {
      decoratedText = `${text}${os.EOL}`;
    }

    process[stdout].write(decoratedText);
  }

  public start(text: string) {
    ux.action.start(chalk.dim(text));
  }

  public stop(code = 0, text = '') {
    const mark = code !== 0 ? chalk.red(logSymbols.error) : chalk.green(logSymbols.success);
    const defaultText = code !== 0 ? 'failed' : 'succeed';
    ux.action.stop(` ${mark} ${chalk.dim(text ?? defaultText)}`);
  }

  getStoreInstanceByStoreFlag(storeFlag?: string) {
    if (!storeFlag) {
      throw new Error('--store flag is missing');
    }

    const storeType = this.config.cli.data.stores?.[storeFlag]?.type ?? storeFlag;
    // * stores may support independent configuration e.g from env vars, local config file etc.
    const storeConfiguration = this.config.cli.data.stores?.[storeFlag]?.configuration;

    if (storeFlag === this.config.bin || storeType === this.config.bin) {
      return constructStore(
        this.config.bin,
        _.merge(
          this.config.configu.data, // from configu login
          {
            // from environment variables
            credentials: {
              org: process.env.CONFIGU_ORG,
              token: process.env.CONFIGU_TOKEN,
            },
            endpoint: process.env.CONFIGU_ENDPOINT,
          },
          storeConfiguration, // from .configu file
          { source: 'cli' },
        ),
      );
    }

    return constructStore(storeType, storeConfiguration);
  }

  async getSchemaInstanceBySchemaFlag(schemaFlag?: string) {
    if (!schemaFlag) {
      throw new Error('--schema flag is missing');
    }

    const schemaBasename = getPathBasename(schemaFlag);
    const [schemaName, cfguExt, fileExt] = schemaBasename.split('.');

    if (!schemaName) {
      throw new ConfigError('invalid config schema', `name mustn't be empty`);
    }

    const ALLOWED_CFGU_EXT = ['json', 'yaml', 'yml'];
    const EXT_ERROR = new ConfigError(
      'invalid config schema',
      `path extension must be one of ${ALLOWED_CFGU_EXT.map((ext) => `.${ConfigSchema.CFGU.NAME}.${ext}`).join(', ')}`,
    );
    if (!fileExt || !ALLOWED_CFGU_EXT.includes(fileExt) || !cfguExt || cfguExt !== ConfigSchema.CFGU.NAME) {
      throw EXT_ERROR;
    }

    const schemaContentsString = await readFile(schemaFlag);
    if (fileExt === 'json') {
      try {
        const schemaContents = loadJSON(schemaFlag, schemaContentsString);
        return new ConfigSchema(schemaName, schemaContents);
      } catch (error) {
        error.message = `JSON Error in ${schemaFlag}:\n${error.message}`;
        throw error;
      }
    }

    if (fileExt === 'yaml' || fileExt === 'yml') {
      try {
        const schemaContents = loadYAML(schemaFlag, schemaContentsString);
        return new ConfigSchema(schemaName, schemaContents);
      } catch (error) {
        error.message = `YAML Error in ${schemaFlag}:\n${error.message}`;
        throw error;
      }
    }

    throw EXT_ERROR;
  }

  reduceConfigFlag(configFlag?: string[]) {
    if (!configFlag) {
      return {};
    }

    return _(configFlag)
      .map((pair, idx) => {
        const [key, ...rest] = pair.split('=');
        if (!key) {
          throw new Error(`config key is missing at --config[${idx}]`);
        }
        return { key, value: rest.join('=') ?? '' };
      })
      .keyBy('key')
      .mapValues('value')
      .value();
  }

  async readPreviousEvalCommandReturn() {
    const stdin = await readStdin();

    if (!stdin) {
      return undefined;
    }

    if (stdin === this.config.UNICODE_NULL) {
      this.exit(1);
    }

    try {
      const previous = JSON.parse(stdin) as EvalCommandReturn;
      if (Object.values(previous).some((value) => !value.context || !value.result)) {
        throw new Error('fail');
      }
      return previous;
    } catch {
      throw new Error(`failed to parse previous eval command return data from stdin`);
    }
  }

  public async init(): Promise<void> {
    this.config.ci = ci;
    this.config.UNICODE_NULL = '\u0000';

    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });
    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;

    try {
      await fs.mkdir(this.config.configDir, { recursive: true });
      await fs.mkdir(this.config.cacheDir, { recursive: true });
    } catch {
      throw new Error(`fail to initialize ${this.config.name} cli`);
    }

    this.config.configu = {
      file: path.join(this.config.configDir, 'config.json'),
      data: {},
    };
    try {
      const rawConfiguConfigData = await readFile(this.config.configu.file, true);
      const configuConfigData = JSON.parse(rawConfiguConfigData);
      this.config.configu.data = configuConfigData;
    } catch {
      this.config.configu.data = {};
    }

    try {
      const ConfigProvider = cosmiconfig(this.config.bin, {
        searchPlaces: [`.${this.config.bin}`],
        searchStrategy: 'global',
      });
      const configResult = await ConfigProvider.search();
      this.config.cli = {
        file: configResult?.filepath,
        data: {},
      };
      const rawCliConfigData = JSON.stringify(configResult?.config ?? this.config.cli.data);
      const compiledCliConfigData = TMPL.render(rawCliConfigData, {
        ...process.env,
        ..._.mapKeys(process.env, (k) => `${k}`),
      });
      const cliConfigData = JSON.parse(compiledCliConfigData);
      this.config.cli.data = cliConfigData;
    } catch (error) {
      throw new Error(`invalid configuration file ${error.message}`);
    }
  }

  protected async catch(error: Error & { exitCode?: number }): Promise<any> {
    // * on any error inject a 'NULL' unicode character so if next command in the pipeline try to read stdin it will fail
    this.print(this.config.UNICODE_NULL, { symbol: 'error', stdout: 'stdout' });

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
