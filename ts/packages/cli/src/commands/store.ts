import { Flags } from '@oclif/core';
import fs from 'fs/promises';
import _ from 'lodash';
import { BaseCommand } from '../base';
import { constructStoreFromUrl } from '../helpers/stores';

export default class Store extends BaseCommand {
  static description = 'caches config store credentials as names to later be used as --store flag value';

  static examples = [
    '<%= config.bin %> <%= command.id %> --name "default" --url "configu://-"',
    '<%= config.bin %> <%= command.id %> --name "secrets" --url "hashicorp-vault://token@address"',
  ];

  static flags = {
    name: Flags.string({ required: true, description: 'name to assign to the cached store' }),
    url: Flags.string({ required: true, description: 'store url to cache' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Store);

    const { url } = await constructStoreFromUrl(flags.url);

    const configDataWithNewStore = _.set(this.config.configData, `stores.${flags.name}`, url);
    const rawConfigData = JSON.stringify(configDataWithNewStore);
    await fs.writeFile(this.config.configFile, rawConfigData);
  }
}
