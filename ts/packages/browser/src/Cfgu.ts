import { Cfgu as BaseCfgu } from '@configu/ts';
import { fileOpen } from 'browser-fs-access';

const FILE_OPEN_DEFAULT_OPTIONS = {
  description: `${BaseCfgu.NAME} files`,
  // todo: submit an application for a cfgu vendor Media Type - https://www.iana.org/assignments/media-types/media-types.xhtml#text
  // mimeTypes: [`application/${CfguType.Json}`],
  // extensions: Cfgu.TYPES.map((type) => `${Cfgu.EXT}.${type}`),
  extensions: BaseCfgu.TYPES.map((type) => `.${type}`),
};

export class Cfgu extends BaseCfgu {
  constructor(public readonly blob: File) {
    super(blob.name);
  }

  async read() {
    this.contents = await this.blob.text();
  }

  static async init(): Promise<Cfgu> {
    const blob = await fileOpen({ ...FILE_OPEN_DEFAULT_OPTIONS });
    return new Cfgu(blob);
  }

  static async initBulk(): Promise<Cfgu[]> {
    const blobs = await fileOpen({ ...FILE_OPEN_DEFAULT_OPTIONS, multiple: true });
    return blobs.map((b) => new Cfgu(b));
  }
}
