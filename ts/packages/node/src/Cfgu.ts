import { promises as fs } from 'fs';
import { Cfgu as BaseCfgu } from '@configu/ts';

export class Cfgu extends BaseCfgu {
  async read() {
    this.contents = await fs.readFile(this.path, { encoding: 'utf8', flag: 'r' });
  }
}
