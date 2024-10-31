import { platform } from 'node:os';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'pathe';
import { tsImport } from 'tsx/esm/api';
import { ConfigStore, ConfigStoreConstructor, Expression, ExpressionFunction } from '@configu/sdk';

const CONFIGU_HOME = path.join(process.cwd(), '/.configu-cache');

const expressionOptionalSuffix = 'Expression';

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
      if (key === 'default') {
        return;
      }
      if (Registry.isConfigStore(value)) {
        let type;
        try {
          type = value.type;
        } catch {
          type = ConfigStore.getTypeByName(key);
        }
        Registry.store.set(type, value);
      } else if (Registry.isExpression(value)) {
        const existingExpressionKeys = Array.from(Expression.functions.keys());
        if (existingExpressionKeys.includes(key)) return;
        try {
          if (key.endsWith(expressionOptionalSuffix)) {
            Expression.register({ key: key.slice(0, -expressionOptionalSuffix.length), fn: value });
          } else {
            Expression.register({ key, fn: value });
          }
        } catch {
          // ignore
        }
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
  static async remoteRegisterStore(type: string) {
    await Registry.ensureCacheDir();

    // TODO: the artifacts should match deterministicType to this work
    // const normalizedType = ConfigStore.deterministicType(type);
    // const MODULE_PATH = path.join(CONFIGU_HOME, `/${normalizedType}.js`);
    const MODULE_PATH = path.join(CONFIGU_HOME, `/${type}.js`);

    // TODO: add sem-ver check for cache invalidation when cached stores are outdated once integration pipeline is reworked

    if (!existsSync(MODULE_PATH)) {
      const platformString = platform();
      const remoteIntegrationUrl = `https://github.com/configu/configu/releases/download/integrations-latest/${type}.os-${platformString}.js`;
      const res = await fetch(remoteIntegrationUrl);
      if (res.ok) {
        await writeFile(MODULE_PATH, await res.text());
      } else {
        throw new Error(`remote integration ${type} not found`);
      }
    }

    await Registry.localRegister(MODULE_PATH);
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
