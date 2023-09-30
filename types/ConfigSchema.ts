import { type Cfgu } from './Cfgu';

export type ConfigSchemaType = "json";

/**
 * An interface of a <file>.cfgu.json, aka ConfigSchema
 * that contains binding records between a unique Config.<key> and its Cfgu declaration
 */
export interface ConfigSchema {
  path: string;
  type: ConfigSchemaType;
}

export interface ConfigSchemaContentsValue extends Cfgu {};
export type ConfigSchemaContents = { [key: string]: ConfigSchemaContentsValue };
