import fs from 'node:fs/promises';
import * as YAML from 'yaml';
import { ObjectConfigStore, type ObjectConfigStoreConfiguration } from '@configu/object';

export type YamlFileConfigStoreConfiguration = ObjectConfigStoreConfiguration & {
  path: string;
};

/**
 * A YAML-file-backed config store with arbitrary nesting.
 *
 * The YAML file structure defines its own nesting. On read, nested paths
 * are joined with `_` to produce the flat configu key. On write, the
 * original structure is preserved.
 *
 * Example — the YAML:
 * ```yaml
 * staging:
 *   database:
 *     host: db.example.com
 *     port: "5432"
 *   cache:
 *     redis:
 *       url: "redis://localhost:6379"
 *   app_name: my-service
 *   app.company_name: Acme Corp
 * ```
 *
 * Produces configu keys (with set `staging`):
 * - `database_host`, `database_port`
 * - `cache_redis_url`
 * - `app_name`
 * - `app.company_name` (dots in YAML keys are literal — only nesting is replaced by `_`)
 *
 * The `hash` strategy falls back to flat keys (hashes can't be nested).
 */
export class YamlFileConfigStore extends ObjectConfigStore {
  private readonly path: string;
  private data: Record<string, string> = {};
  /** Maps flat key → path segments (for reconstructing nested YAML on save) */
  private keyPaths: Map<string, string[]> = new Map();
  private loaded = false;

  constructor(configuration: YamlFileConfigStoreConfiguration) {
    super(configuration);
    this.path = configuration.path;
  }

  override async init() {
    try {
      await fs.access(this.path);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(this.path, '{}\n');
      } else {
        throw error;
      }
    }
    await this.load();
  }

  /**
   * Get the separator for the active strategy.
   * Returns undefined for `hash` (no separator → flat keys).
   */
  private get separator(): string | undefined {
    if (this.strategy === 'hash') {
      return undefined;
    }
    if (this.strategy === 'dot') {
      return '.';
    }
    return this.strategy;
  }

  /**
   * Recursively flatten a nested object. Path segments below the set level
   * are joined with `_` to form the configu key.
   *
   * `{ database: { host: "db.example.com" } }` with prefix [] → key `database_host`, path `["database", "host"]`
   */
  private flattenRecursive(obj: Record<string, any>, segments: string[], flat: Record<string, string>): void {
    for (const [k, v] of Object.entries(obj)) {
      const currentSegments = [...segments, k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        this.flattenRecursive(v, currentSegments, flat);
      } else {
        const key = currentSegments.join('_');
        flat[key] = String(v);
        this.keyPaths.set(key, currentSegments);
      }
    }
  }

  /**
   * Flatten the top-level nested YAML to composite keys.
   * The first level uses the strategy separator (set), deeper levels use `_`.
   */
  private flatten(nested: Record<string, any>): Record<string, string> {
    const flat: Record<string, string> = {};
    const sep = this.separator;
    this.keyPaths.clear();

    for (const [k, v] of Object.entries(nested)) {
      if (sep && v && typeof v === 'object' && !Array.isArray(v)) {
        // k is the set name — recurse into its children
        const setFlat: Record<string, string> = {};
        this.flattenRecursive(v, [], setFlat);
        for (const [flatKey, flatValue] of Object.entries(setFlat)) {
          flat[`${k}${sep}${flatKey}`] = flatValue;
        }
      } else {
        flat[k] = String(v);
        this.keyPaths.set(k, [k]);
      }
    }

    return flat;
  }

  /**
   * Unflatten composite keys back to nested YAML.
   * Uses stored keyPaths to reconstruct the original tree structure.
   * Keys without stored paths go flat under their set.
   */
  private unflatten(flat: Record<string, string>): Record<string, any> {
    const sep = this.separator;

    if (!sep) {
      return { ...flat };
    }

    const nested: Record<string, any> = {};

    for (const [compositeKey, value] of Object.entries(flat)) {
      const idx = compositeKey.indexOf(sep);
      if (idx === -1) {
        nested[compositeKey] = value;
      } else {
        const group = compositeKey.slice(0, idx);
        const key = compositeKey.slice(idx + sep.length);

        if (!nested[group] || typeof nested[group] !== 'object') {
          nested[group] = {};
        }

        const segments = this.keyPaths.get(key);
        if (segments && segments.length > 1) {
          // Reconstruct nested path
          let current = nested[group];
          for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i]!;
            if (!current[seg] || typeof current[seg] !== 'object') {
              current[seg] = {};
            }
            current = current[seg];
          }
          current[segments[segments.length - 1]!] = value;
        } else {
          // No stored path or single segment — flat under set
          nested[group][key] = value;
        }
      }
    }

    return nested;
  }

  private async load(): Promise<void> {
    const content = await fs.readFile(this.path, 'utf8');
    const parsed = YAML.parse(content);
    if (parsed && typeof parsed === 'object') {
      this.data = this.flatten(parsed);
    } else {
      this.data = {};
    }
    this.loaded = true;
  }

  private async save(): Promise<void> {
    const nested = this.unflatten(this.data);
    const content = YAML.stringify(nested, { lineWidth: 0 });
    await fs.writeFile(this.path, content);
  }

  protected async getByKey(key: string): Promise<string | undefined> {
    if (!this.loaded) {
      await this.load();
    }
    return this.data[key];
  }

  protected async upsert(key: string, value: string): Promise<void> {
    if (!this.loaded) {
      await this.load();
    }
    this.data[key] = value;
    await this.save();
  }

  protected async delete(key: string): Promise<void> {
    if (!this.loaded) {
      await this.load();
    }
    delete this.data[key];
    await this.save();
  }
}
