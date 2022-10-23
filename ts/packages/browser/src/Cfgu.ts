import { Cfgu as BaseCfgu } from '@configu/ts';
import { fileOpen } from 'browser-fs-access';

export class Cfgu extends BaseCfgu {
  constructor(public readonly blob: File) {
    super(blob.name);
  }

  async read() {
    this.contents = await this.blob.text();
  }

  static async init(): Promise<Cfgu[]> {
    const blobs = await fileOpen({
      // mimeTypes: [`application/${CfguType.Json}`],
      description: 'Cfgu files',
      extensions: Cfgu.TYPES.map((type) => `${Cfgu.EXT}.${type}`),
      multiple: true,
    });
    return blobs.map((blob) => new Cfgu(blob));
  }
}
