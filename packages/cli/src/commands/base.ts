import { Command, Option, UsageError } from 'clipanion';
import _ from 'lodash';
import { ConfiguInterface, getConfiguHomeDir, parseJSON, readFile } from '@configu/common';
import { ConfigStore, EvalCommandOutput } from '@configu/sdk';
import path from 'node:path';
import { type CustomContext } from '../index';
import { configuStoreType } from '../helpers';

export type Context = CustomContext & {
  UNICODE_NULL: '\u0000';
  stdin: NodeJS.ReadStream;
} & (typeof ConfiguInterface)['context'];

export abstract class BaseCommand extends Command<Context> {
  debug = Option.Boolean('--debug');

  configu = Option.String('--config,--configuration', { description: 'Path, URL or JSON of a .configu file' });

  public async init(): Promise<void> {
    this.context.UNICODE_NULL = '\u0000';
    if (this.debug) {
      this.context.stdio.level = 4;
    }
    await ConfiguInterface.init({ configuInput: this.configu });
    this.context = { ...this.context, ...ConfiguInterface.context };
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

  async readStdin() {
    const { stdin } = process;
    if (stdin.isTTY) {
      return '';
    }
    return new Promise<string>((resolve) => {
      const chunks: Uint8Array[] = [];
      stdin.on('data', (chunk) => {
        chunks.push(chunk);
      });
      stdin.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
    });
  }

  async readPreviousEvalCommandOutput() {
    const stdin = await this.readStdin();

    if (!stdin) {
      return undefined;
    }

    if (stdin === this.context.UNICODE_NULL) {
      process.exit(1);
    }

    try {
      const previous = parseJSON('', stdin) as EvalCommandOutput;
      if (
        Object.values(previous).some(
          (config) =>
            !_.has(config, 'key') || !_.has(config, 'cfgu') || !_.has(config, 'origin') || !_.has(config, 'value'),
        )
      ) {
        throw new Error('fail');
      }
      return previous;
    } catch {
      throw new Error(`failed to parse previous eval command return data from stdin`);
    }
  }

  override catch(error: any): Promise<void> {
    // console.log('====================')
    // const isUsageError = error instanceof UsageError;
    // if (!isUsageError) {
    // * on any error inject a 'NULL' unicode character so if next command in the pipeline try to read stdin it will fail
    this.context.stdio.log(this.context.UNICODE_NULL);
    // }

    // if (!axios.isAxiosError(error)) {
    //   return super.catch(error);
    // }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error?.message) {
      throw new Error(error.message);
    }
    // if (error?.request) {
    //   return super.catch(
    //     new Errors.CLIError(
    //       "There seems to be a problem connecting to Configu's servers. Please check your network connection and try again.",
    //     ),
    //   );
    // }
    throw error;
  }
}
