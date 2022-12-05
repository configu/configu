import { ConfigSchema } from "./ConfigSchema";

export interface SchemaContentsValue extends ConfigSchema {};
export type SchemaContents = { [key: string]: SchemaContentsValue };

