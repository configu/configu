import path from 'node:path';
import { platform } from 'node:os';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { ConfigStore, Expression, ExpressionFunction } from '@configu/sdk';

export type ConfigStoreConstructor = new (configuration: object) => ConfigStore;

export class Registry {
  static store = new Map<string, ConfigStoreConstructor>();

  static isConfigStore(value: any): value is ConfigStoreConstructor {
    return typeof value === 'function' && value.prototype instanceof ConfigStore;
  }

  static isExpression(value: any): value is ExpressionFunction<any[], any> {
    return typeof value === 'function';
  }

  static async register(filePath: string) {
    const module = await import(filePath);

    Object.entries(module).forEach(([key, value]) => {
      // console.log('Registering:', key, value);
      if (key === 'default') {
        return;
      }
      if (Registry.isConfigStore(value)) {
        console.log('Registering Store:', key);
        Registry.store.set(key, value);
      } else if (Registry.isExpression(value)) {
        console.log('Registering Expression:', key);
        Expression.register({ key, fn: value });
      }
    });
  }

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
}
