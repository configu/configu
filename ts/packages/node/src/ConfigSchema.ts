import { promises as fs } from 'fs';
import { ConfigSchema as BaseConfigSchema } from '@configu/ts';

export class ConfigSchema extends BaseConfigSchema {
  async read() {
    return fs.readFile(this.path, { encoding: 'utf8', flag: 'r' });
  }
}
