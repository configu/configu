import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import * as YAML from 'yaml';
import { YamlFileConfigStore } from './index';

let tmpDir: string;
let filePath: string;

async function createStore(yamlContent?: Record<string, any>, strategy?: string): Promise<YamlFileConfigStore> {
  if (yamlContent) {
    await fs.writeFile(filePath, YAML.stringify(yamlContent));
  }
  const config: any = { path: filePath };
  if (strategy) {
    config.strategy = strategy;
  }
  const store = new YamlFileConfigStore(config);
  await store.init();
  return store;
}

async function readYaml(): Promise<Record<string, any>> {
  const content = await fs.readFile(filePath, 'utf8');
  return YAML.parse(content);
}

describe('YamlFileConfigStore', () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'configu-yaml-test-'));
    filePath = path.join(tmpDir, 'config.yaml');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('init', () => {
    it('creates file if it does not exist', async () => {
      await createStore();
      const stat = await fs.stat(filePath);
      assert.ok(stat.isFile());
    });

    it('loads existing YAML file', async () => {
      const store = await createStore({ staging: { host: 'db.example.com' } });
      const results = await store.get([{ set: 'staging', key: 'host' }]);
      assert.equal(results.length, 1);
      assert.equal(results[0]?.value, 'db.example.com');
    });
  });

  describe('get — flat values', () => {
    it('reads top-level keys with empty set', async () => {
      const store = await createStore({ myKey: 'myValue' });
      const results = await store.get([{ set: '', key: 'myKey' }]);
      assert.equal(results.length, 1);
      assert.equal(results[0]?.value, 'myValue');
    });

    it('reads set.key with dot strategy', async () => {
      const store = await createStore({ production: { DB_HOST: 'localhost' } });
      const results = await store.get([{ set: 'production', key: 'DB_HOST' }]);
      assert.equal(results.length, 1);
      assert.equal(results[0]?.value, 'localhost');
    });
  });

  describe('get — nested values', () => {
    it('flattens nested keys with underscore', async () => {
      const store = await createStore({
        staging: {
          database: {
            host: 'db.example.com',
            port: '5432',
          },
        },
      });
      const results = await store.get([
        { set: 'staging', key: 'database_host' },
        { set: 'staging', key: 'database_port' },
      ]);
      assert.equal(results.length, 2);
      assert.equal(results[0]?.value, 'db.example.com');
      assert.equal(results[1]?.value, '5432');
    });

    it('handles deeply nested structures', async () => {
      const store = await createStore({
        prod: {
          cache: {
            redis: {
              url: 'redis://localhost:6379',
            },
          },
        },
      });
      const results = await store.get([{ set: 'prod', key: 'cache_redis_url' }]);
      assert.equal(results.length, 1);
      assert.equal(results[0]?.value, 'redis://localhost:6379');
    });
  });

  describe('set — upsert', () => {
    it('writes a new value and persists to disk', async () => {
      const store = await createStore({});
      await store.set([{ set: 'dev', key: 'PORT', value: '8080' }]);

      const yaml = await readYaml();
      assert.equal(yaml.dev.PORT, '8080');
    });

    it('updates an existing value', async () => {
      const store = await createStore({ dev: { PORT: '3000' } });
      await store.set([{ set: 'dev', key: 'PORT', value: '8080' }]);

      const yaml = await readYaml();
      assert.equal(yaml.dev.PORT, '8080');
    });

    it('preserves nested structure on save', async () => {
      const store = await createStore({
        staging: {
          database: {
            host: 'old-host',
            port: '5432',
          },
        },
      });

      await store.set([{ set: 'staging', key: 'database_host', value: 'new-host' }]);

      const yaml = await readYaml();
      assert.equal(yaml.staging.database.host, 'new-host');
      assert.equal(yaml.staging.database.port, '5432');
    });
  });

  describe('set — delete', () => {
    it('removes a key when value is empty', async () => {
      const store = await createStore({ prod: { HOST: 'localhost', PORT: '3000' } });
      await store.set([{ set: 'prod', key: 'HOST', value: '' }]);

      const results = await store.get([{ set: 'prod', key: 'HOST' }]);
      assert.equal(results.length, 0);

      // PORT should still exist
      const remaining = await store.get([{ set: 'prod', key: 'PORT' }]);
      assert.equal(remaining.length, 1);
    });
  });

  describe('custom strategy', () => {
    it('uses :: as separator', async () => {
      await fs.writeFile(filePath, YAML.stringify({ 'staging::DB_HOST': 'localhost' }));
      const store = await createStore(undefined, '::');

      const results = await store.get([{ set: 'staging', key: 'DB_HOST' }]);
      assert.equal(results.length, 1);
      assert.equal(results[0]?.value, 'localhost');
    });

    it('writes with custom separator', async () => {
      const store = await createStore({}, '/');
      await store.set([{ set: 'env', key: 'KEY', value: 'val' }]);

      const yaml = await readYaml();
      assert.equal(yaml.env.KEY, 'val');
    });
  });
});
