import _ from 'lodash';
import { ConfigKey } from './ConfigKey';

/**
 * A unique, case-sensitive path within a tree-like data structure that groups `Config`s contextually.
 * https://configu.com/docs/config-set/
 */
export class ConfigSet {
  static readonly separator = '/';
  static readonly root = '';
  static readonly rootLabel = '/';

  public readonly hierarchy: string[] = [];

  constructor(public readonly path: string = ConfigSet.root) {
    this.path = this.path.trim();

    if (this.path.startsWith(ConfigSet.rootLabel)) {
      this.path = this.path.slice(1);
    }

    if (this.path.endsWith(ConfigSet.separator)) {
      this.path = this.path.slice(0, -1);
    }

    if (this.path === ConfigSet.root) {
      this.hierarchy = [ConfigSet.root];
      return;
    }

    this.hierarchy = this.path.split(ConfigSet.separator).map((cur, idx, sets) => {
      ConfigKey.validate({ key: cur, errorPrefix: 'ConfigSet.path' });

      return _.take(sets, idx + 1).join(ConfigSet.separator);
    });
    this.hierarchy.unshift(ConfigSet.root);
  }
}
