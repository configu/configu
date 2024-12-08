/**
 * A generic representation of `application configuration` using three properties: `key`, `value`, `set`.
 * https://configu.com/docs/terminology/#config
 */
export interface Config {
  set: string;
  key: string;
  value: string;
}
