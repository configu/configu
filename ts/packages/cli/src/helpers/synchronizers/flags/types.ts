import { Interfaces } from '@oclif/core';
import { ConfigSynchronizerFlags } from '@configu/lib';

export type FlagsType<T extends string> = { [key in T]: Interfaces.Flag<string | undefined> };

export type ParsedFlagsType = { [key in ConfigSynchronizerFlags]: string | undefined };

export type ExtractorFunction = (params: { flags: ParsedFlagsType }) => {
  [key: string]: string | boolean | undefined;
};
