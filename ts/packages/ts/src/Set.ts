import _ from 'lodash';
import { Cfgu } from './Cfgu';
import { ERR } from './utils';

const ROOT_SET_CHAR = '';
const ROOT_SET_CHAR_ALIAS = '/';

export class Set {
  public readonly hierarchy: string[] = [];
  constructor(public readonly path: string = ROOT_SET_CHAR) {
    if (path !== '/' && path.endsWith('/')) {
      throw new Error(ERR(`invalid path "${path}"`, ['set.path'], `path mustn't end with / character`));
    }

    if (path.startsWith(ROOT_SET_CHAR_ALIAS)) {
      this.path = path.slice(1);
    }

    if (this.path === ROOT_SET_CHAR) {
      this.hierarchy = [ROOT_SET_CHAR];
      return;
    }

    this.hierarchy = this.path.split('/').map((cur, idx, sets) => {
      if (!Cfgu.validateNaming(cur)) {
        throw new Error(ERR(`invalid path "${path}"`, ['set.path'], `provided path contains invalid characters`));
      }
      return _.take(sets, idx + 1).join('/');
    });
    this.hierarchy.unshift(ROOT_SET_CHAR);
  }
}
