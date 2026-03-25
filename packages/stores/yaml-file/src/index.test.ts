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

  describe('_abstract base inheritance', () => {
    it('merges _abstract parent under child set key', async () => {
      const basePath = path.join(tmpDir, 'base.yaml');
      await fs.writeFile(
        basePath,
        YAML.stringify({
          _abstract: { database: { host: 'base-host', port: '5432' } },
        }),
      );
      await fs.writeFile(
        filePath,
        YAML.stringify({
          staging: { database: { host: 'child-host' } },
        }),
      );
      const store = new YamlFileConfigStore({ path: [basePath, filePath] });
      await store.init();

      const host = await store.get([{ set: 'staging', key: 'database_host' }]);
      assert.equal(host[0]?.value, 'child-host');
      const port = await store.get([{ set: 'staging', key: 'database_port' }]);
      assert.equal(port[0]?.value, '5432');
    });

    it('inherits parent keys not present in child', async () => {
      const basePath = path.join(tmpDir, 'base.yaml');
      await fs.writeFile(
        basePath,
        YAML.stringify({
          _abstract: { smtp: { host: 'mail.example.com' } },
        }),
      );
      await fs.writeFile(
        filePath,
        YAML.stringify({
          prod: { app: { name: 'my-service' } },
        }),
      );
      const store = new YamlFileConfigStore({ path: [basePath, filePath] });
      await store.init();

      const smtp = await store.get([{ set: 'prod', key: 'smtp_host' }]);
      assert.equal(smtp[0]?.value, 'mail.example.com');
      const app = await store.get([{ set: 'prod', key: 'app_name' }]);
      assert.equal(app[0]?.value, 'my-service');
    });

    it('writes go to last path file only', async () => {
      const basePath = path.join(tmpDir, 'base.yaml');
      await fs.writeFile(
        basePath,
        YAML.stringify({
          _abstract: { DB: 'base-db' },
        }),
      );
      await fs.writeFile(filePath, YAML.stringify({ dev: {} }));
      const store = new YamlFileConfigStore({ path: [basePath, filePath] });
      await store.init();

      await store.set([{ set: 'dev', key: 'DB', value: 'new-db' }]);

      const parentYaml = YAML.parse(await fs.readFile(basePath, 'utf8'));
      assert.equal(parentYaml._abstract.DB, 'base-db');
      const childYaml = YAML.parse(await fs.readFile(filePath, 'utf8'));
      assert.equal(childYaml.dev.DB, 'new-db');
    });

    it('same base serves multiple sets in one child', async () => {
      const basePath = path.join(tmpDir, 'base.yaml');
      await fs.writeFile(
        basePath,
        YAML.stringify({
          _abstract: { shared_key: 'shared-val' },
        }),
      );
      await fs.writeFile(
        filePath,
        YAML.stringify({
          dev: { own_key: 'dev-val' },
          staging: { own_key: 'staging-val' },
        }),
      );
      const store = new YamlFileConfigStore({ path: [basePath, filePath] });
      await store.init();

      const devShared = await store.get([{ set: 'dev', key: 'shared_key' }]);
      assert.equal(devShared[0]?.value, 'shared-val');
      const stagingShared = await store.get([{ set: 'staging', key: 'shared_key' }]);
      assert.equal(stagingShared[0]?.value, 'shared-val');
    });

    it('backward compatible — single path without _abstract', async () => {
      const store = await createStore({ dev: { PORT: '3000' } });
      const results = await store.get([{ set: 'dev', key: 'PORT' }]);
      assert.equal(results[0]?.value, '3000');
    });
  });

  describe('multi-file merge — multiple abstract files', () => {
    it('merges multiple _abstract files left-to-right', async () => {
      const infraPath = path.join(tmpDir, 'infra.yaml');
      const appPath = path.join(tmpDir, 'app.yaml');
      await fs.writeFile(
        infraPath,
        YAML.stringify({
          _abstract: {
            cluster: { storage: 'local-path' },
            shared_val: 'from-infra',
          },
        }),
      );
      await fs.writeFile(
        appPath,
        YAML.stringify({
          _abstract: {
            app: { name: 'my-app' },
            shared_val: 'from-app',
          },
        }),
      );
      await fs.writeFile(
        filePath,
        YAML.stringify({
          prod: { cluster: { name: 'konoha' } },
        }),
      );
      const store = new YamlFileConfigStore({
        path: [infraPath, appPath, filePath],
      });
      await store.init();

      const storage = await store.get([{ set: 'prod', key: 'cluster_storage' }]);
      assert.equal(storage[0]?.value, 'local-path');
      const appName = await store.get([{ set: 'prod', key: 'app_name' }]);
      assert.equal(appName[0]?.value, 'my-app');
      const shared = await store.get([{ set: 'prod', key: 'shared_val' }]);
      assert.equal(shared[0]?.value, 'from-app');
      const clusterName = await store.get([{ set: 'prod', key: 'cluster_name' }]);
      assert.equal(clusterName[0]?.value, 'konoha');
    });
  });

  describe('multi-file merge — multiple set files', () => {
    it('merges multiple set files left-to-right', async () => {
      const configPath = path.join(tmpDir, 'config.yaml');
      const secretsPath = path.join(tmpDir, 'secrets.yaml');
      await fs.writeFile(
        configPath,
        YAML.stringify({
          myenv: { app: { host: 'example.com' } },
        }),
      );
      await fs.writeFile(
        secretsPath,
        YAML.stringify({
          myenv: { app: { api_key: 'secret123' } },
        }),
      );
      const store = new YamlFileConfigStore({
        path: [configPath, secretsPath],
      });
      await store.init();

      const host = await store.get([{ set: 'myenv', key: 'app_host' }]);
      assert.equal(host[0]?.value, 'example.com');
      const key = await store.get([{ set: 'myenv', key: 'app_api_key' }]);
      assert.equal(key[0]?.value, 'secret123');
    });

    it('writes go to last path file', async () => {
      const configPath = path.join(tmpDir, 'config.yaml');
      const secretsPath = path.join(tmpDir, 'secrets.yaml');
      await fs.writeFile(configPath, YAML.stringify({ dev: { A: '1' } }));
      await fs.writeFile(secretsPath, YAML.stringify({ dev: { B: '2' } }));
      const store = new YamlFileConfigStore({
        path: [configPath, secretsPath],
      });
      await store.init();

      await store.set([{ set: 'dev', key: 'C', value: '3' }]);

      const secretsYaml = YAML.parse(await fs.readFile(secretsPath, 'utf8'));
      assert.ok('C' in (secretsYaml.dev ?? {}));
      const configYaml = YAML.parse(await fs.readFile(configPath, 'utf8'));
      assert.equal(configYaml.dev?.C, undefined);
    });
  });
});
