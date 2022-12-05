/**
 * A generic representation of a software configuration, aka Config
 */
export interface Config {
  key: string;
  schema: string;
  set: string;
  value: string;
}

export type EvaluatedConfigs = { [key: string]: string };
export type EvaluatedConfigsArray = { key: string; value: string }[];
