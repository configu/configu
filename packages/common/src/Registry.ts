import { platform } from 'node:os';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'pathe';
import { tsImport } from 'tsx/esm/api';
import { ConfigStore, ConfigStoreConstructor, Expression, ExpressionFunction } from '@configu/sdk';

export class Registry {
  private static store = new Map<string, ConfigStoreConstructor>();

  static isConfigStore(value: unknown): value is ConfigStoreConstructor {
    return typeof value === 'function' && 'type' in value;
  }

  static isExpression(value: unknown): value is ExpressionFunction<any[], any> {
    return typeof value === 'function';
  }

  static async import(filePath: string) {
    // const module = await import(filePath);
    const module = await tsImport(filePath, import.meta.url);
    return module;
  }

  static async register(filePath: string) {
    const module = await Registry.import(filePath);

    Object.entries(module).forEach(([key, value]) => {
      // console.log('Registering:', key, value);

      if (key === 'default') {
        return;
      }
      if (Registry.isConfigStore(value)) {
        // console.log('Registering ConfigStore:', value.type);
        Registry.store.set(value.type, value);
      } else if (Registry.isExpression(value)) {
        // console.log('Registering Expression:', key);
        Expression.register({ key, fn: value });
      }
    });
  }

  // todo: handle initialization of $HOME/.configu/.cache
  static async remoteRegister(key: string) {
    const VERSION = 'latest';
    const CONFIGU_HOME = path.join(process.cwd(), '/.configu-cache');

    const MODULE_PATH = path.join(CONFIGU_HOME, `/${key}-${VERSION}.js`);

    if (!existsSync(MODULE_PATH)) {
      const res = await fetch(
        `https://github.com/configu/configu/releases/download/${VERSION}/${key}-${platform()}.js`,
      );
      if (res.ok) {
        await mkdir(CONFIGU_HOME, { recursive: true });
        await writeFile(MODULE_PATH, await res.text());
      }
    }
    Registry.register(MODULE_PATH);
  }

  static constructStore(type: string, configuration = {}): ConfigStore {
    const StoreCtor = Registry.store.get(type);
    if (!StoreCtor) {
      throw new Error(`unknown store type ${type}`);
    }

    return new StoreCtor(configuration);
  }
}
