import { Flags } from '@oclif/core';
import fs from 'fs/promises';
import _ from 'lodash';
import { BaseCommand } from '../base';
import { constructStoreFromUrl } from '../helpers/stores';

export default class Store extends BaseCommand {
  static description = 'tbd';

  static examples = ['<%= config.bin %> <%= command.id %> tbd'];

  static flags = {
    name: Flags.string({ required: true, description: 'tbd' }),
    url: Flags.string({ required: true, description: 'tbd' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Store);

    const { url } = await constructStoreFromUrl(flags.url);

    const configDataWithNewStore = _.set(this.config.configData, `stores.${flags.name}`, url);
    const rawConfigData = JSON.stringify(configDataWithNewStore);
    await fs.writeFile(this.config.configFile, rawConfigData);
  }
}
