import { Command, Option, UsageError } from 'clipanion';
import sea from 'node:sea';
import { log } from '@clack/prompts';
import getStdin from 'get-stdin';
import { _, EvalCommandOutput } from '@configu/sdk';
import { debug, ConfiguInterface, parseJsonFile } from '@configu/common';

import { type RunContext } from '..';

export type Context = RunContext & (typeof ConfiguInterface)['context'] & { isExecutable: boolean };

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
    // todo: think to wrap with try/catch and throw a UsageError
    await ConfiguInterface.initConfig(this.config);

    this.context = {
      ...this.context,
      ...ConfiguInterface.context,
      isExecutable: sea.isSea() && process.execPath.endsWith(this.cli.binaryName),
    };
    debug('BaseCommand', this.context);
  }

  reduceKVFlag(configFlag?: string[]) {
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

  async readPreviousEvalCommandOutput() {
    const stdin = await getStdin();
    debug(`<-- stdin`, stdin);

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
      throw new Error(`Failed to parse previous eval command return data from stdin`);
    }
  }

  override catch(error: any): Promise<void> {
    log.error(error.message);
    debug(error);
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject(1);
  }
}
