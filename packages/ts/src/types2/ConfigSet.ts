/**
 * A unique, case-sensitive path within a tree-like data structure that groups `Config`s contextually.
 * https://configu.com/docs/config-set/
 */
export interface ConfigSet {
  path: string;
  hierarchy: string[];
}
