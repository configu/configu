import { Cfgu } from './Cfgu';

export interface ConfigSchemaContentsValue extends Cfgu {};
export type ConfigSchemaContents = { [ConfigKey: string]: ConfigSchemaContentsValue };

/**
 * An interface of a <file>.cfgu.json, aka ConfigSchema
 * that contains binding records between a unique Config.<key> and its Cfgu declaration
 */
export interface ConfigSchema {
  name: string;
  contents: ConfigSchemaContents;
}
