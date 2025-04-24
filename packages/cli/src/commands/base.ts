import { Command, Option, UsageError } from 'clipanion';
import sea from 'node:sea';
import { log } from '@clack/prompts';
import getStdin from 'get-stdin';
import { _, EvalCommandOutput } from '@configu/sdk';
import { debug, inspect, ConfiguInterface, parseJsonFile } from '@configu/common';

import { type RunContext } from '..';

export type Context = RunContext &
  (typeof ConfiguInterface)['context'] & { isExecutable: boolean; pipe?: EvalCommandOutput };

export abstract class BaseCommand extends Command<Context> {
  // todo: consider verbose to the cli logger
  debug = Option.Boolean('--debug,--verbose', {
    description: 'Enable debug mode',
    hidden: true,
  });

  config = Option.String('--config', {
    description: 'Path, URL or Stringified JSON of a .configu file',
    hidden: true,
  });

  public async init(): Promise<void> {
    const pipe = await this.readPreviousEvalCommandOutput();

    // todo: think to wrap with try/catch and throw a UsageError
    await ConfiguInterface.init(this.config);
    if (ConfiguInterface.context.exec.isExecFromHome) {
      await this.checkForUpdates();
    }

    this.context = {
      ...this.context,
      ...ConfiguInterface.context,
      isExecutable:
        sea.isSea() && process.execPath.endsWith(`${this.cli.binaryName}${ConfiguInterface.context.exec.ext}`),
      pipe,
    };
  }

  public reduceKVFlag(configFlag?: string[]) {
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

  private async readPreviousEvalCommandOutput() {
    const stdin = await getStdin();
    debug.extend('cli')(`<-- stdin`, stdin.length);

    if (!stdin) {
      return undefined;
    }

    try {
      const pipe = parseJsonFile('', stdin) as EvalCommandOutput;
      if (
        Object.values(pipe).some(
          (config) =>
            !_.has(config, 'key') || !_.has(config, 'cfgu') || !_.has(config, 'origin') || !_.has(config, 'value'),
        )
      ) {
        throw new Error();
      }
      return pipe;
    } catch {
      debug('Invalid input from stdin', stdin);
      throw new Error(`Failed to parse previous eval command result from stdin`, { cause: { silent: true } });
    }
  }

  private async checkForUpdates() {
    // todo: implement update check using packageJson and configuFilesApi
    // ConfiguInterface.context.interface
  }

  override catch(error: any): Promise<void> {
    debug.extend('cli')(`--> catch`, inspect(error));

    // print the error message if it's not silent
    if (!error?.cause?.silent) {
      log.error(error.message);
    }

    // bypass clipanion error handling
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject(1);
  }
}
