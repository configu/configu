import fs from 'node:fs/promises';
import path from 'pathe';
import _ from 'lodash';
import { ConfigSchema, ConfigSet } from '@configu/sdk';
import { EvalCommandOutput, EvaluatedConfigOrigin, UpsertCommand } from '@configu/sdk/commands';
import { ConfiguFile } from './ConfiguFile';
import { CfguFile } from './CfguFile';
import { stdenv, getConfiguHomeDir } from './utils';

export class ConfiguInterface {
  public static context: { stdenv: typeof stdenv; upperConfigu?: ConfiguFile; localConfigu: ConfiguFile };

  static async init({ configuInput }: { configuInput?: string }) {
    // todo: resolve any casting
    this.context = {} as any;
    this.context.stdenv = stdenv;
    const homedir = await getConfiguHomeDir();

    const localConfiguFilePath = path.join(homedir, '.configu'); // $HOME/.configu/.configu
    try {
      this.context.localConfigu = await ConfiguFile.load(localConfiguFilePath);
    } catch {
      this.context.localConfigu = new ConfiguFile(localConfiguFilePath, {}, 'yaml');
      try {
        await fs.unlink(localConfiguFilePath);
      } catch {
        // ignore
      }
    }

    const upperConfiguInput =
      configuInput ??
      stdenv.env.CONFIGU_CONFIG ??
      stdenv.env.CONFIGU_CONFIGURATION ??
      (await ConfiguFile.searchClosest());
    if (upperConfiguInput) {
      this.context.upperConfigu = await ConfiguFile.loadFromInput(upperConfiguInput);
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
