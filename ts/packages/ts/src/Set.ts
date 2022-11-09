import _ from 'lodash';
import { ERR } from './utils';
import { Cfgu } from './Cfgu';
import { ISet } from './types';

export class Set implements ISet {
  public readonly hierarchy: string[] = [];
  constructor(public readonly path: string = Set.ROOT) {
    if (path.startsWith(Set.SEPARATOR) && path.endsWith(Set.SEPARATOR)) {
      throw new Error(ERR(`invalid path "${path}"`, ['set.path'], `path mustn't end with ${Set.SEPARATOR} character`));
    }

    if (this.path === Set.ROOT) {
      this.hierarchy = [Set.ROOT];
      return;
    }

    this.hierarchy = this.path.split(Set.SEPARATOR).map((cur, idx, sets) => {
      if (!Cfgu.validateNaming(cur)) {
        throw new Error(ERR(`invalid path "${path}"`, ['set.path'], `provided path contains invalid characters`));
      }
      return _.take(sets, idx + 1).join(Set.SEPARATOR);
    });
    this.hierarchy.unshift(Set.ROOT);
  }

  static SEPARATOR = '/' as const;
  static ROOT = '' as const;
  static ROOT_LABEL = '/' as const;
}
