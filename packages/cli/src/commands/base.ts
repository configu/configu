import { Command, Option, UsageError } from 'clipanion';
import { _ } from '@configu/sdk/expressions';
import { console, ConfiguInterface, parseJSON } from '@configu/common';
import { EvalCommandOutput } from '@configu/sdk/commands';
import getStdin from 'get-stdin';

import { type RunContext } from '..';

export type Context = RunContext & (typeof ConfiguInterface)['context'];

export abstract class BaseCommand extends Command<Context> {
  // todo: consider verbose to the cli logger
  verbose = Option.Boolean('--verbose');

  config = Option.String('--config', { description: 'Path, URL or Stringified JSON of a .configu file' });

  public async init(): Promise<void> {
    // todo: think to wrap with try/catch and throw a UsageError
    await ConfiguInterface.init({ input: this.config });
    this.context = { ...this.context, ...ConfiguInterface.context };
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
    this.context.console.debug(`stdin`, stdin);

    if (!stdin) {
      return undefined;
    }

    try {
      const pipe = parseJSON('', stdin) as EvalCommandOutput;
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
    console.error(error);
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject(1);
  }
}
