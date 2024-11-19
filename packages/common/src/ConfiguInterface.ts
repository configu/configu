import os from 'node:os';
import fs from 'node:fs/promises';
import { URL, fileURLToPath } from 'node:url';
import path from 'pathe';

import _ from 'lodash';

import { ConfigSchema, ConfigSchemaKeysSchema, JSONSchema, JSONSchemaObject, FromSchema } from '@configu/sdk';

import { ConfiguFile } from './ConfiguFile';
import { CfguFile } from './CfguFile';

import { stdenv, findUp, getConfiguHomeDir, readFile, parseJSON, parseYAML } from './utils';

export class ConfiguInterface {
  // public static readonly localConfig = path.join(ConfiguInterface.homedir, '.configu');
  // static allowedExtensions = ['json', 'yaml', 'yml'];

  public static context: { stdenv: typeof stdenv; upperConfigu?: ConfiguFile; localConfigu: ConfiguFile };

  static async init({ configuInput }: { configuInput?: string }) {
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

  // static async getStoreInstance(name: string): Promise<ConfigStore> {
  //   let store = this.context.upperConfigu?.getStoreInstance;
  //   const store = this.context.localConfigu.contents.stores?.[name];
  //   if (!store) {
  //     throw new Error(`store "${name}" not found in local configu`);
  //   }

  //   const storeType = store.type;
  //   const storeConstructor = await importModule(storeType);
  //   return new storeConstructor(store.configuration);
  // }

  static async search(): Promise<CfguFile> {
    // todo: implement search of one or multi .cfgu file here
    throw new Error('Not implemented');
  }
}
