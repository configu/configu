import { platform } from 'node:os';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'pathe';
import { tsImport } from 'tsx/esm/api';
import { ConfigStore, ConfigStoreConstructor, Expression, ExpressionFunction } from '@configu/sdk';

const CONFIGU_HOME = path.join(process.cwd(), '/.configu-cache');

export class Registry {
  static store = new Map<string, ConfigStoreConstructor>();

  static isConfigStore(value: unknown): value is ConfigStoreConstructor {
    return typeof value === 'function' && 'type' in value;
  }

  static isExpression(value: unknown): value is ExpressionFunction<any[], any> {
    return typeof value === 'function';
  }

  static async register(module: Record<string, unknown>) {
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

  static async import(filePath: string) {
    // const module = await import(filePath);
    const module = await tsImport(filePath, import.meta.url);
    return module;
  }

  static async localRegister(filePath: string) {
    const module = await Registry.import(filePath);
    Registry.register(module);
  }

  private static async ensureCacheDir() {
    try {
      await mkdir(CONFIGU_HOME, { recursive: true });
    } catch {
      // ignore
    }
  }

  // todo: handle initialization of $HOME/.configu/.cache
  static async remoteRegister(key: string) {
    if (Registry.store.has(key)) {
      return;
    }
    await Registry.ensureCacheDir();

    const [KEY, VERSION = 'latest'] = key.split('@');
    const MODULE_PATH = path.join(CONFIGU_HOME, `/${KEY}-${VERSION}.js`);

    if (!existsSync(MODULE_PATH)) {
      const res = await fetch(
        `https://github.com/configu/configu/releases/download/integrations-${VERSION}/${KEY}-${platform()}.js`,
      );
      if (res.ok) {
        await writeFile(MODULE_PATH, await res.text());
      }
    }

    Registry.localRegister(MODULE_PATH);
  }

  static constructStore(type: string, configuration = {}): ConfigStore {
    const normalizedType = ConfigStore.deterministicType(type);
    const StoreCtor = Registry.store.get(normalizedType);
    if (!StoreCtor) {
      throw new Error(`unknown store type ${type}`);
    }

    return new StoreCtor(configuration);
  }
}
