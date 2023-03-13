/**
 * An interface of a path in an hierarchy, aka ConfigSet
 * that uniquely groups Config.<key> with their Config.<value>.
 */
export interface ConfigSet {
  path: string;
  hierarchy: string[];
}
