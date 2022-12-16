import { Flags, CliUx } from '@oclif/core';
import _ from 'lodash';
import { BaseCommand } from '../../base';

export default class StoreList extends BaseCommand {
  static description = 'lists saved config-store connections';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  public async run(): Promise<void> {
    const { flags } = await this.parse(StoreList);

    const data = _(this.config.configData.stores ?? {})
      .entries()
      .map(([label, cs]) => ({ label, cs }))
      .value();
    CliUx.ux.table(data, { label: { header: 'Label' }, cs: { header: 'Connection String' } });

    this.log(`view the full cli configuration file at ${this.config.configFile}`);
  }
}
