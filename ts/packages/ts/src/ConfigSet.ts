import _ from 'lodash';
import { type IConfigSet } from './types';
import { ConfigError, NAME } from './utils';

export class ConfigSet implements IConfigSet {
  static SEPARATOR = '/' as const;
  static ROOT = '' as const;
  static ROOT_LABEL = '/' as const;

  public readonly hierarchy: string[] = [];

  constructor(public readonly path: string = ConfigSet.ROOT) {
    const errorReason = 'invalid config set path';
    const errorScope: [string, string][] = [['ConfigSet', this.path]];

    if (this.path.startsWith(ConfigSet.ROOT_LABEL)) {
      this.path = this.path.slice(1);
    }

    if (this.path.endsWith(ConfigSet.SEPARATOR)) {
      throw new ConfigError(errorReason, `path mustn't end with ${ConfigSet.SEPARATOR} character`, errorScope);
    }

    if (this.path === ConfigSet.ROOT) {
      this.hierarchy = [ConfigSet.ROOT];
      return;
    }

    this.hierarchy = this.path.split(ConfigSet.SEPARATOR).map((cur, idx, sets) => {
      if (!NAME(cur)) {
        throw new ConfigError(errorReason, `path nodes mustn't contain reserved words "${cur}"`, errorScope);
      }
      return _.take(sets, idx + 1).join(ConfigSet.SEPARATOR);
    });
    this.hierarchy.unshift(ConfigSet.ROOT);
  }
}
