import { Cfgu as BaseCfgu } from '@configu/ts';
import { fileOpen } from 'browser-fs-access';

export class Cfgu extends BaseCfgu {
  constructor(public readonly blob: File) {
    super(blob.name);
  }

  async read() {
    this.contents = await this.blob.text();
  }

  static async init(multiple: false): Promise<Cfgu>;
  static async init(multiple: true): Promise<Cfgu[]>;
  static async init(multiple = false): Promise<Cfgu | Cfgu[]> {
    const blob = await fileOpen({
      description: 'Cfgu files',
      // todo: submit an application for a cfgu vendor Media Type - https://www.iana.org/assignments/media-types/media-types.xhtml#text
      // mimeTypes: [`application/${CfguType.Json}`],
      // extensions: Cfgu.TYPES.map((type) => `${Cfgu.EXT}.${type}`),
      extensions: Cfgu.TYPES.map((type) => `.${type}`),
      multiple,
    });
    if (Array.isArray(blob)) {
      return blob.map((b) => new Cfgu(b));
    }
    return new Cfgu(blob);
  }
}
