import { platform } from 'node:os';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'pathe';
import { tsImport } from 'tsx/esm/api';
import { ConfigStore, ConfigStoreConstructor, Expression, ExpressionFunction } from '@configu/sdk';

const CONFIGU_HOME = path.join(process.cwd(), '/.configu-cache');

export class Registry {
  private static store = new Map<string, ConfigStoreConstructor>();

  static isConfigStore(value: unknown): value is ConfigStoreConstructor {
    return typeof value === 'function' && 'type' in value;
  }

  static isExpression(value: unknown): value is ExpressionFunction<any[], any> {
    return typeof value === 'function';
  }

  private static async ensureCacheDir() {
    await mkdir(path.join(CONFIGU_HOME, '/utils'), { recursive: true });
    await writeFile(
      path.join(CONFIGU_HOME, 'package.json'),
      JSON.stringify({
        name: 'cached-integrations',
        version: '1.0.0',
        imports: {
          '#configu/*': './utils/*.mjs',
        },
      }),
    );
    const g = global as any;
    g.ConfiguSDK = await import('@configu/sdk');
    await writeFile(
      path.join(CONFIGU_HOME, '/utils/sdk.mjs'),
      `
    ${Object.keys(g.ConfiguSDK)
      .map((key) => `export const ${key} = ConfiguSDK.${key};`)
      .join('\n')}
    `,
    );
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
        await writeFile(MODULE_PATH, (await res.text()).replaceAll('@configu/sdk', '#configu/sdk'));
      }
    }
    await Registry.register(MODULE_PATH);
  }

  static constructStore(type: string, configuration = {}): ConfigStore {
    const StoreCtor = Registry.store.get(ConfigStore.deterministicType(type));
    if (!StoreCtor) {
      throw new Error(`unknown store type ${type}`);
    }

    return new StoreCtor(configuration);
  }
}
