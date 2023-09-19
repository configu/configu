import { promises as fs } from 'fs';
import { ConfigSchema as BaseConfigSchema } from '@configu/ts';

export class ConfigSchema extends BaseConfigSchema {
  static async fromFile(path: string): Promise<ConfigSchema> {
    const schemaContentsString = await fs.readFile(path, { encoding: 'utf8', flag: 'r' });
    return BaseConfigSchema.fromFile(path, schemaContentsString);
  }
}
