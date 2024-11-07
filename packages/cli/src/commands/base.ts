import { Command, Option } from 'clipanion';
import _ from 'lodash';
import { CfguFile, ConfiguFile, getConfiguHomeDirSafely, parseJSON, readFile, Registry } from '@configu/common';
import { EvalCommandOutput } from '@configu/sdk';
import path from 'node:path';
import { type CustomContext } from '../index';
import { configuStoreType } from '../helpers';

export type Context = CustomContext & {
  configu: ConfiguFile;
  credentials: {
    file: string; // $HOME/.config/configu/config.json
    data:
      | {
          credentials: { org: string; token: string };
          endpoint?: string;
          source?: string;
          tag?: string;
        }
      | Record<string, never>;
  };
  UNICODE_NULL: '\u0000';
  stdin: NodeJS.ReadStream;
};

export abstract class BaseCommand extends Command<Context> {
  debug = Option.Boolean('--debug');

  settings = Option.String('--settings', { description: 'Path to a .configu file' });

  public async init(): Promise<void> {
    this.context.UNICODE_NULL = '\u0000';

    let configu: ConfiguFile;
    if (this.settings) configu = await ConfiguFile.load(this.settings);
    else configu = await ConfiguFile.search();
    this.context.configu = configu;

    const configuHomeDir = await getConfiguHomeDirSafely();
    const configuCredentialFilePath = path.join(configuHomeDir, 'config.json');
    try {
      const rawConfiguConfigData = await readFile(configuCredentialFilePath, true);
      const configuConfigData = JSON.parse(rawConfiguConfigData);
      this.context.credentials = {
        file: configuCredentialFilePath,
        data: configuConfigData,
      };
    } catch {
      this.context.credentials = {
        file: configuCredentialFilePath,
        data: {},
      };
    }

    if (this.debug) this.context.stdio.level = 4;
  }

  getBackupStoreInstanceByFlag(flag?: string) {
    if (!flag) {
      return undefined;
    }
    return this.context.configu.getBackupStoreInstance(flag);
  }

  async getStoreInstanceByStoreFlag(flag?: string) {
    if (!flag) {
      throw new Error('--store,--st flag is missing');
    }
    let storeConfig: Record<string, unknown> = {};
    const storeType = this.context.configu.contents.stores?.[flag]?.type;
    if (storeType === configuStoreType || flag === configuStoreType) {
      storeConfig = { credentials: this.context.credentials.data.credentials };
    }
    let store = await this.context.configu.getStoreInstance(flag, storeConfig);
    if (!store) {
      store = Registry.constructStore(flag, storeConfig);
    }
    return store;
  }

  async getSchemaInstanceByFlag(flag?: string) {
    if (!flag) {
      throw new Error('--schema,--se flag is missing');
    }
    let schema = await this.context.configu.getSchemaInstance(flag);
    if (!schema) {
      const cfgu = await CfguFile.load(flag);
      schema = cfgu.constructSchema();
    }
    return schema;
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
    // * on any error inject a 'NULL' unicode character so if next command in the pipeline try to read stdin it will fail
    this.context.stdio.log(this.context.UNICODE_NULL);

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
