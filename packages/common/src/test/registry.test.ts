import test, { describe, mock, beforeEach, afterEach } from 'node:test';
import path from 'node:path';
import * as assert from 'node:assert';
import { Expression } from '@configu/sdk';
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { Registry as RegistryType } from '../registry';

async function importFresh(modulePath) {
  const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`;
  return import(cacheBustingModulePath);
}

describe('Registry', () => {
  let Registry: typeof RegistryType;
  beforeEach(async () => {
    Registry = (await importFresh('../registry')).Registry;
  });

  test('should register a store', async () => {
    assert.equal(Registry.store.has('DemoStoreStub'), false);

    await Registry.register('./stub/demo-store.stub.js');

    assert.equal(Registry.store.has('DemoStoreStub'), true);
  });

  test('should register an expression', async () => {
    assert.equal(Expression.functions.has('isInt'), false);
    assert.equal(Expression.functions.has('Dotenv'), false);

    await Registry.register('./stub/expressions.stub.js');

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
      assert.equal(Registry.store.has('DemoStubStore'), false);

      await Registry.register('./stub/demo-store.stub.js');
      assert.equal(Registry.store.has('DemoStubStore'), true);

      assert.equal(mockFetch.mock.calls.length, 0);

      const existingStore = Registry.store.get('DemoStubStore');

      await Registry.remoteRegister('DemoStubStore');

      assert.equal(Registry.store.has('DemoStubStore'), true);
      assert.equal(Registry.store.get('DemoStubStore'), existingStore);
      assert.equal(mockFetch.mock.calls.length, 0);
    });

    test('should use cached store if exists instead of fetching from github', async () => {
      const randomStoreClassName = `DemoStub${Math.random().toString(36).substring(7)}Store`;

      assert.equal(Registry.store.has(randomStoreClassName), false);
      await mkdir(cacheDir, { recursive: true });
      await writeFile(
        path.join(cacheDir, `/${randomStoreClassName}-latest.js`),
        `
export class ${randomStoreClassName} {
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
      assert.equal(Registry.store.has(randomStoreClassName), true);
    });

    test('should fetch remote store and register it', async () => {
      const randomStoreClassName = `FetchedDemoStub${Math.random().toString(36).substring(7)}Store`;

      assert.equal(Registry.store.has(randomStoreClassName), false);
      assert.equal(mockFetch.mock.calls.length, 0);

      mockFetch.mock.mockImplementation(async () => {
        return {
          ok: true,
          async text() {
            return `
export class ${randomStoreClassName} {
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
      assert.equal(Registry.store.has(randomStoreClassName), true);
    });
  });
});
