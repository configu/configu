import { Cfgu } from './Cfgu';

export interface ConfigSchemaContentsValue extends Cfgu {};
export type ConfigSchemaContents = { [ConfigKey: string]: ConfigSchemaContentsValue };

/**
 * A file containing binding records linking each unique `ConfigKey` to its corresponding `Cfgu` declaration.
 * https://configu.com/docs/config-schema/
 */
export interface ConfigSchema {
  name: string;
  contents: ConfigSchemaContents;
}
