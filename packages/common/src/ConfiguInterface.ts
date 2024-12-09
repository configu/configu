import fs from 'node:fs/promises';
import path from 'pathe';
import { _ } from '@configu/sdk/expressions';
import { ConfigSchema, ConfigSet } from '@configu/sdk';
import { EvalCommandOutput, EvaluatedConfigOrigin, UpsertCommand } from '@configu/sdk/commands';
import { ConfiguFile } from './ConfiguFile';
import { CfguFile } from './CfguFile';
import { console, environment, getConfiguHomeDir } from './utils';

export class ConfiguInterface {
  public static context: {
    console: typeof console;
    environment: typeof environment;
    homedir: string;
    upperConfigu?: ConfiguFile;
    localConfigu: ConfiguFile;
  };

  static async init({ input }: { input?: string }) {
    // todo: resolve any casting
    this.context = {} as any;
    this.context.console = console;
    this.context.environment = environment;
    this.context.homedir = await getConfiguHomeDir();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { process, env, ...rest } = environment;
    console.debug('initiating interface', rest);

    const localConfiguFilePath = path.join(this.context.homedir, '.configu'); // $HOME/.configu/.configu
    console.debug('localConfiguFilePath', localConfiguFilePath);
    try {
      this.context.localConfigu = await ConfiguFile.load(localConfiguFilePath);
      console.debug('localConfiguFilePath loaded');
    } catch {
      this.context.localConfigu = new ConfiguFile(localConfiguFilePath, {}, 'yaml');
      console.debug('localConfiguFilePath failed to load');
      try {
        await fs.unlink(localConfiguFilePath);
      } catch {
        // ignore
      }
    }

    const upperConfiguInput =
      input ??
      environment.env.CONFIGU_CONFIG ??
      environment.env.CONFIGU_CONFIGURATION ??
      (await ConfiguFile.searchClosest());
    console.debug('upperConfiguInput', upperConfiguInput);
    if (upperConfiguInput) {
      this.context.upperConfigu = await ConfiguFile.loadFromInput(upperConfiguInput);
      console.debug('upperConfiguInput loaded');
    }
  }

  static async getStoreInstance(nameOrType?: string) {
    let store =
      (await this.context.upperConfigu?.getStoreInstance(nameOrType)) ??
      (await this.context.localConfigu.getStoreInstance(nameOrType));

    if (!store && nameOrType) {
      store = await ConfiguFile.constructStore(nameOrType);
    }

    if (!store) {
      throw new Error(`store "${nameOrType}" is not found`);
    }

    return store;
  }

  static async backupEvalOutput({
    storeName,
    set,
    schema,
    evalOutput,
  }: {
    storeName?: string;
    set: ConfigSet;
    schema: ConfigSchema;
    evalOutput: EvalCommandOutput;
  }) {
    if (!storeName) {
      return;
    }

    const store =
      (await this.context.upperConfigu?.getBackupStoreInstance(storeName)) ??
      (await this.context.localConfigu.getBackupStoreInstance(storeName));

    if (!store) {
      return;
    }

    const configs = _(evalOutput)
      .pickBy((entry) => entry.origin === EvaluatedConfigOrigin.Store)
      .mapValues((entry) => entry.value)
      .value();

    await new UpsertCommand({
      store,
      set,
      schema,
      configs,
    }).run();
  }

  static async getSchemaInstance(nameOrPath?: string) {
    if (!nameOrPath) {
      const paths = await CfguFile.searchNeighbors();
      if (paths.length === 0) {
        throw new Error('schema is not found');
      }
      return CfguFile.constructSchema(...paths);
    }

    let schema =
      (await this.context.upperConfigu?.getSchemaInstance(nameOrPath)) ??
      (await this.context.localConfigu.getSchemaInstance(nameOrPath));

    if (!schema && nameOrPath) {
      schema = await CfguFile.constructSchema(nameOrPath);
    }

    if (!schema) {
      throw new Error(`schema "${nameOrPath}" is not found`);
    }

    return schema;
  }
}
