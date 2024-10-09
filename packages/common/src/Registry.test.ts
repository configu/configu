import test, { describe, mock, beforeEach, afterEach } from 'node:test';
import path from 'node:path';
import * as assert from 'node:assert';
import { Expression } from '@configu/sdk';
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { type Registry as RegistryType } from './Registry';

async function importFresh(modulePath) {
  const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
  return import(cacheBustingModulePath);
}

describe('Registry', () => {
  const classSuffix = 'ConfigStore';
  let Registry: typeof RegistryType;
  beforeEach(async () => {
    Registry = (await importFresh('./Registry')).Registry;
  });

  test('should register a store', async () => {
    assert.equal(Registry.store.has('demo'), false);

    await Registry.localRegister('./stub/demo-store.stub.js');

    assert.equal(Registry.store.has('demo'), true);
  });

  test('should register an expression', async () => {
    assert.equal(Expression.functions.has('isInt'), false);
    assert.equal(Expression.functions.has('Dotenv'), false);

    await Registry.localRegister('./stub/expressions.stub.js');

    assert.equal(Expression.functions.has('isInt'), true);
    assert.equal(Expression.functions.has('Dotenv'), true);
  });

  describe('remote register', () => {
    let mockFetch = mock.fn<any>();
    const originalFetch = globalThis.fetch;

    const cacheDir = path.join(process.cwd(), './.configu-cache');

    beforeEach(async () => {
      mockFetch = mock.fn();
      globalThis.fetch = mockFetch;
    });

    afterEach(async () => {
      globalThis.fetch = originalFetch;
      try {
        if (existsSync(cacheDir)) {
          execSync(`rm -rf ${cacheDir}`);
        }
      } catch {
        // Ignore
      }
    });

    test('should not remote register a store if already registered', async () => {
      assert.equal(Registry.store.has('demo'), false);

      await Registry.localRegister('./stub/demo-store.stub.js');
      assert.equal(Registry.store.has('demo'), true);

      assert.equal(mockFetch.mock.calls.length, 0);

      const existingStore = Registry.store.get('demo');

      await Registry.remoteRegister('demo');

      assert.equal(Registry.store.has('demo'), true);
      assert.equal(Registry.store.get('demo'), existingStore);
      assert.equal(mockFetch.mock.calls.length, 0);
    });

    // todo: fix all skip tests
    test.skip('should use cached store if exists instead of fetching from github', async () => {
      const randomStoreClassName = `DemoStub${Math.random().toString(36).substring(7)}ConfigStore`;

      assert.equal(Registry.store.has(randomStoreClassName), false);
      await mkdir(cacheDir, { recursive: true });
      await writeFile(
        path.join(cacheDir, `/${randomStoreClassName}-latest.js`),
        `
export class ${randomStoreClassName}${classSuffix} {
  static type = '${randomStoreClassName.toLowerCase()}';
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}`,
      );

      await Registry.remoteRegister(randomStoreClassName);

      assert.equal(mockFetch.mock.calls.length, 0);
      assert.equal(Registry.store.has(randomStoreClassName.toLowerCase()), true);
    });

    test.skip('should fetch remote store and register it', async () => {
      const randomStoreClassName = `FetchedDemoStub${Math.random().toString(36).substring(7)}`;

      assert.equal(Registry.store.has(randomStoreClassName.toLowerCase()), false);
      assert.equal(mockFetch.mock.calls.length, 0);

      mockFetch.mock.mockImplementation(async () => {
        return {
          ok: true,
          async text() {
            return `
export class ${randomStoreClassName}${classSuffix} {
  static type = '${randomStoreClassName.toLowerCase()}';
  get(queries) {
    throw new Error('Method not implemented.');
  }

  set(configs) {
    throw new Error('Method not implemented.');
  }
}`;
          },
        };
      });

      await Registry.remoteRegister(randomStoreClassName);
      assert.equal(mockFetch.mock.calls.length, 1);
      assert.equal(Registry.store.has(randomStoreClassName.toLowerCase()), true);
    });
  });
});
