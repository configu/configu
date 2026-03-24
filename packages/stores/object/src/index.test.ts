import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { type Config, type ConfigQuery } from '@configu/sdk';
import { ObjectConfigStore, type ObjectConfigStoreConfiguration } from './index';

/** In-memory concrete implementation for testing the abstract base class. */
class TestObjectConfigStore extends ObjectConfigStore {
  readonly store = new Map<string, string>();

  constructor(configuration: ObjectConfigStoreConfiguration = {}) {
    super(configuration);
  }

  protected async getByKey(key: string): Promise<string | undefined> {
    return this.store.get(key);
  }

  protected async upsert(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  protected async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('ObjectConfigStore', () => {
  describe('computeKey', () => {
    it('returns just the key when set is empty (dot strategy)', () => {
      const store = new TestObjectConfigStore({ strategy: 'dot' });
      // Access protected method via subclass
      const key = (store as any).computeKey('', 'myKey');
      assert.equal(key, 'myKey');
    });

    it('uses dot separator by default', () => {
      const store = new TestObjectConfigStore();
      const key = (store as any).computeKey('production', 'DB_HOST');
      assert.equal(key, 'production.DB_HOST');
    });

    it('uses hash strategy', () => {
      const store = new TestObjectConfigStore({ strategy: 'hash' });
      const key = (store as any).computeKey('production', 'DB_HOST');
      const expected = crypto.hash('md5', 'productionDB_HOST', 'hex');
      assert.equal(key, expected);
    });

    it('uses custom separator', () => {
      const store = new TestObjectConfigStore({ strategy: '::' });
      const key = (store as any).computeKey('staging', 'PORT');
      assert.equal(key, 'staging::PORT');
    });

    it('uses / as separator', () => {
      const store = new TestObjectConfigStore({ strategy: '/' });
      const key = (store as any).computeKey('dev', 'API_KEY');
      assert.equal(key, 'dev/API_KEY');
    });
  });

  describe('get', () => {
    let store: TestObjectConfigStore;

    beforeEach(() => {
      store = new TestObjectConfigStore();
      store.store.set('prod.HOST', 'localhost');
      store.store.set('prod.PORT', '3000');
    });

    it('returns matching configs', async () => {
      const queries: ConfigQuery[] = [
        { set: 'prod', key: 'HOST' },
        { set: 'prod', key: 'PORT' },
      ];
      const results = await store.get(queries);
      assert.equal(results.length, 2);
      assert.deepEqual(results, [
        { set: 'prod', key: 'HOST', value: 'localhost' },
        { set: 'prod', key: 'PORT', value: '3000' },
      ]);
    });

    it('excludes missing keys', async () => {
      const queries: ConfigQuery[] = [
        { set: 'prod', key: 'HOST' },
        { set: 'prod', key: 'MISSING' },
      ];
      const results = await store.get(queries);
      assert.equal(results.length, 1);
      assert.equal(results[0]?.key, 'HOST');
    });

    it('returns empty array when nothing matches', async () => {
      const queries: ConfigQuery[] = [{ set: 'dev', key: 'HOST' }];
      const results = await store.get(queries);
      assert.equal(results.length, 0);
    });
  });

  describe('set', () => {
    let store: TestObjectConfigStore;

    beforeEach(() => {
      store = new TestObjectConfigStore();
    });

    it('upserts configs with values', async () => {
      const configs: Config[] = [{ set: 'prod', key: 'HOST', value: 'db.example.com' }];
      await store.set(configs);
      assert.equal(store.store.get('prod.HOST'), 'db.example.com');
    });

    it('deletes configs with empty values', async () => {
      store.store.set('prod.HOST', 'old-value');
      const configs: Config[] = [{ set: 'prod', key: 'HOST', value: '' }];
      await store.set(configs);
      assert.equal(store.store.has('prod.HOST'), false);
    });

    it('handles mixed upsert and delete', async () => {
      store.store.set('prod.OLD', 'remove-me');
      const configs: Config[] = [
        { set: 'prod', key: 'OLD', value: '' },
        { set: 'prod', key: 'NEW', value: 'hello' },
      ];
      await store.set(configs);
      assert.equal(store.store.has('prod.OLD'), false);
      assert.equal(store.store.get('prod.NEW'), 'hello');
    });
  });
});
