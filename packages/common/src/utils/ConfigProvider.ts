import _ from 'lodash';
import { cosmiconfig, CosmiconfigResult } from 'cosmiconfig';
import { TMPL } from '@configu/ts';

export class ConfigProvider {
  constructor(public readonly content: any) {}

  static parseLoadResult(result: CosmiconfigResult) {
    if (!result) throw new Error('no configuration file found');
    try {
      const stringifiedContent = JSON.stringify(result.config);
      const compiledCliConfigData = TMPL.render(stringifiedContent, {
        ...process.env,
        ..._.mapKeys(process.env, (k) => `${k}`),
      });
      const configData = JSON.parse(compiledCliConfigData);
      return configData;
    } catch (error) {
      throw new Error(`invalid configuration file ${error.message}`);
    }
  }

  static async loadFromPath(filePath: string): Promise<ConfigProvider> {
    let result: CosmiconfigResult;
    try {
      result = await cosmiconfig('configu').load(filePath);
    } catch (error) {
      // * https://nodejs.org/api/errors.html#errors_common_system_errors
      if (error.code === 'ENOENT') {
        throw new Error('no such file or directory');
      }
      if (error.code === 'EISDIR') {
        throw new Error('expected a file, but the given path was a directory');
      }

      throw error;
    }

    const content = this.parseLoadResult(result);
    return new ConfigProvider(content);
  }

  static async loadFromSearch(): Promise<ConfigProvider> {
    const explorer = cosmiconfig('configu', {
      searchPlaces: ['.configu'],
      searchStrategy: 'global',
    });
    const result = await explorer.search();

    const content = this.parseLoadResult(result);
    return new ConfigProvider(content);
  }
}
