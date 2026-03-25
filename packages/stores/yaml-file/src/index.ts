import fs from 'node:fs/promises';
import * as YAML from 'yaml';
import { ObjectConfigStore, type ObjectConfigStoreConfiguration } from '@configu/object';

export type YamlFileConfigStoreConfiguration = ObjectConfigStoreConfiguration & {
  path: string | string[];
};

/**
 * A YAML-file-backed config store with arbitrary nesting and multi-file merge.
 *
 * `path` accepts a single file or an array of files. Files are classified
 * automatically:
 * - **Abstract**: top-level key is `_abstract` — shared/partial config
 * - **Set**: top-level keys are concrete set names (e.g. `staging:`)
 *
 * Merge order (left-to-right, later overrides earlier):
 * 1. All abstract files are deep-merged → base data
 * 2. All set files are deep-merged → set data
 * 3. Base data is injected under each set key (set values override base)
 *
 * Writes always go to the **last** file in the `path` array.
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
  private static readonly ABSTRACT_KEY = '_abstract';

  private readonly paths: string[];
  private readonly primaryPath: string;
  private data: Record<string, string> = {};
  /** Maps flat key → path segments (for reconstructing nested YAML on save) */
  private keyPaths: Map<string, string[]> = new Map();
  private loaded = false;

  constructor(configuration: YamlFileConfigStoreConfiguration) {
    super(configuration);
    this.paths = Array.isArray(configuration.path) ? configuration.path : [configuration.path];
    this.primaryPath = this.paths[this.paths.length - 1]!;
  }

  override async init() {
    // Validate all non-primary paths exist
    for (const p of this.paths.slice(0, -1)) {
      await fs.access(p);
    }
    // Create primary path if missing
    try {
      await fs.access(this.primaryPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(this.primaryPath, '{}\n');
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

  private async loadYaml(filePath: string): Promise<Record<string, any>> {
    const content = await fs.readFile(filePath, 'utf8');
    return YAML.parse(content) ?? {};
  }

  private deepMerge(base: Record<string, any>, overlay: Record<string, any>): Record<string, any> {
    const result = { ...base };
    for (const [key, value] of Object.entries(overlay)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        result[key] &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        result[key] = this.deepMerge(result[key], value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private async load(): Promise<void> {
    let baseData: Record<string, any> = {};
    let setData: Record<string, any> = {};

    for (const p of this.paths) {
      const raw = await this.loadYaml(p);

      if (YamlFileConfigStore.ABSTRACT_KEY in raw) {
        // Abstract file — merge content under _abstract key into base
        const data = raw[YamlFileConfigStore.ABSTRACT_KEY];
        if (data && typeof data === 'object') {
          baseData = this.deepMerge(baseData, data);
        }
      } else {
        // Set file — merge into set data
        setData = this.deepMerge(setData, raw);
      }
    }

    // Inject base under each set key
    if (Object.keys(baseData).length > 0) {
      const merged: Record<string, any> = {};
      for (const [setName, setValue] of Object.entries(setData)) {
        if (setValue && typeof setValue === 'object' && !Array.isArray(setValue)) {
          merged[setName] = this.deepMerge(baseData, setValue);
        } else {
          merged[setName] = setValue;
        }
      }
      this.data = this.flatten(merged);
    } else {
      this.data = this.flatten(setData);
    }

    this.loaded = true;
  }

  private async save(): Promise<void> {
    const nested = this.unflatten(this.data);
    const content = YAML.stringify(nested, { lineWidth: 0 });
    await fs.writeFile(this.primaryPath, content);
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
