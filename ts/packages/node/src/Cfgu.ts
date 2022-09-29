import fs from 'fs/promises';
import { Cfgu as ACfgu } from '@configu/ts';

export class Cfgu extends ACfgu {
  read(): Promise<string> {
    return fs.readFile(this.path, 'utf8');
  }
}
