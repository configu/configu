import { fileOpen } from 'browser-fs-access';
import { ConfigSchema as BaseConfigSchema } from '@configu/ts';

export class ConfigSchema extends BaseConfigSchema {
  static async fromFile(): Promise<ConfigSchema> {
    const blob = await fileOpen({
      description: `${BaseConfigSchema.CFGU.NAME} files`,
      // todo: submit an application for a cfgu vendor Media Type - https://www.iana.org/assignments/media-types/media-types.xhtml#text
      // mimeTypes: [`application/${CfguType.Json}`],
      // extensions: Cfgu.TYPES.map((type) => `${Cfgu.EXT}.${type}`),
      extensions: BaseConfigSchema.TYPES.map((type) => `.${type}`),
    });
    const schemaContentsString = await blob.text();

    return BaseConfigSchema.fromFile(blob.name, schemaContentsString);
  }
}
