import { Flags } from '@oclif/core';
import _ from 'lodash';
import { BaseCommand } from '../../base';

export default class StoreDelete extends BaseCommand<typeof StoreDelete> {
  static description = 'deletes config-store connections';

  static examples = ['<%= config.bin %> <%= command.id %> --label "my-store"'];

  static flags = {
    label: Flags.string({
      description: 'config-store connection label',
      required: true,
      multiple: true,
      char: 'l',
    }),
  };

  public async run(): Promise<void> {
    this.flags.label.forEach((label) => {
      _.unset(this.config.configData, `stores.${label}`);
    });

    await this.writeConfigData();
    this.log(`${this.flags.label.join(', ')} deleted from cli configuration`);
  }
}
