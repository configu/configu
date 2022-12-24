import _ from 'lodash';
import { IConfigSet } from './types';
import { ERR } from './utils';
import { ConfigSchema } from './ConfigSchema';

export class ConfigSet implements IConfigSet {
  static SEPARATOR = '/' as const;
  static ROOT = '' as const;
  static ROOT_LABEL = '/' as const;

  public readonly hierarchy: string[] = [];

  constructor(public readonly path: string = ConfigSet.ROOT) {
    if (this.path.startsWith(ConfigSet.ROOT_LABEL)) {
      this.path = this.path.slice(1);
    }

    if (this.path.endsWith(ConfigSet.SEPARATOR)) {
      throw new Error(
        ERR(`invalid path "${path}"`, {
          location: [`ConfigSet`, `constructor`],
          suggestion: `path mustn't end with ${ConfigSet.SEPARATOR} character`,
        }),
      );
    }

    if (this.path === ConfigSet.ROOT) {
      this.hierarchy = [ConfigSet.ROOT];
      return;
    }

    this.hierarchy = this.path.split(ConfigSet.SEPARATOR).map((cur, idx, sets) => {
      if (!ConfigSchema.validateNaming(cur)) {
        throw new Error(
          ERR(`invalid path "${path}"`, {
            location: [`ConfigSet`, `constructor`],
            suggestion: `path nodes mustn't contain reserved words "${cur}"`,
          }),
        );
      }
      return _.take(sets, idx + 1).join(ConfigSet.SEPARATOR);
    });
    this.hierarchy.unshift(ConfigSet.ROOT);
  }
}
