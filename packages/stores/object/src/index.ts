import crypto from 'node:crypto';
import { type Config, ConfigStore, type ConfigQuery } from '@configu/sdk';

/**
 * Built-in key strategies:
 * - `'dot'`  → `set.key`  (default)
 * - `'hash'` → `md5(set + key)` (deterministic, fixed-length)
 *
 * Any other string is treated as a literal separator:
 * - `'+'`  → `set+key`
 * - `'/'`  → `set/key`
 * - `'::'` → `set::key`
 */
export type ObjectKeyStrategy = 'dot' | 'hash' | (string & {});

export type ObjectConfigStoreConfiguration = {
  strategy?: ObjectKeyStrategy;
  [key: string]: any;
};

/**
 * Abstract base class for stores that map each `(set, key)` pair
 * to a single storage entry via a configurable key strategy.
 *
 * Unlike `KeyValueConfigStore` (which groups keys under a set),
 * `ObjectConfigStore` treats every config entry independently —
 * the composite key is computed from the strategy and used as-is.
 *
 * Subclasses implement three primitives: `getByKey`, `upsert`, `delete`.
 *
 * Configure via `.configu`:
 * ```yaml
 * stores:
 *   my-store:
 *     type: my-custom
 *     strategy: "hash"
 *     configuration:
 *       # store-specific options
 * ```
 */
export abstract class ObjectConfigStore extends ConfigStore {
  protected readonly strategy: ObjectKeyStrategy;

  constructor(configuration: ObjectConfigStoreConfiguration = {}) {
    super(configuration);
    this.strategy = configuration?.strategy ?? 'dot';
  }

  /**
   * Compute the storage key for a `(set, key)` pair based on the active strategy.
   */
  protected computeKey(set: string, key: string): string {
    if (!set) {
      return key;
    }

    switch (this.strategy) {
      case 'dot':
        return `${set}.${key}`;
      case 'hash':
        return crypto.hash('md5', `${set}${key}`, 'hex');
      default:
        // Strategy string is used as the literal separator
        return `${set}${this.strategy}${key}`;
    }
  }

  protected abstract getByKey(key: string): Promise<string | undefined>;
  protected abstract upsert(key: string, value: string): Promise<void>;
  protected abstract delete(key: string): Promise<void>;

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    const results = await Promise.all(
      queries.map(async ({ set, key }) => {
        try {
          const compositeKey = this.computeKey(set, key);
          const value = await this.getByKey(compositeKey);
          return { set, key, value: value ?? '' };
        } catch {
          return { set, key, value: '' };
        }
      }),
    );
    return results.filter((c) => c.value);
  }

  async set(configs: Config[]): Promise<void> {
    await Promise.all(
      configs.map(async (config) => {
        const compositeKey = this.computeKey(config.set, config.key);
        if (!config.value) {
          await this.delete(compositeKey);
        } else {
          await this.upsert(compositeKey, config.value);
        }
      }),
    );
  }
}
