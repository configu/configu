import { fileOpen } from 'browser-fs-access';
import { ConfigSchema as BaseConfigSchema } from '@configu/ts';

const FILE_OPEN_DEFAULT_OPTIONS = {
  description: `${BaseConfigSchema.CFGU.NAME} files`,
  // todo: submit an application for a cfgu vendor Media Type - https://www.iana.org/assignments/media-types/media-types.xhtml#text
  // mimeTypes: [`application/${CfguType.Json}`],
  // extensions: Cfgu.TYPES.map((type) => `${Cfgu.EXT}.${type}`),
  extensions: BaseConfigSchema.TYPES.map((type) => `.${type}`),
};

export class ConfigSchema extends BaseConfigSchema {
  constructor(public readonly blob: File) {
    super(blob.name);
  }

  async read() {
    this.contents = await this.blob.text();
  }

  static async init(): Promise<ConfigSchema> {
    const blob = await fileOpen({ ...FILE_OPEN_DEFAULT_OPTIONS });
    return new ConfigSchema(blob);
  }

  static async initBulk(): Promise<ConfigSchema[]> {
    const blobs = await fileOpen({ ...FILE_OPEN_DEFAULT_OPTIONS, multiple: true });
    return blobs.map((blob) => new ConfigSchema(blob));
  }
}
