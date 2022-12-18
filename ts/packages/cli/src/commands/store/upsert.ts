import { Flags, CliUx } from '@oclif/core';
import _ from 'lodash';
import { Cfgu } from '@configu/node';
import { getStoreConnectionStringPlaceholder } from '@configu/lib';
import { BaseCommand } from '../../base';
import { constructStoreFromConnectionString, constructStoreFromInteractiveSession } from '../../helpers/stores';

export default class StoreUpsert extends BaseCommand {
  static description = 'creates/updates config-store connections';

  static examples = [
    '<%= config.bin %> <%= command.id %> --label "my-store" -l "other-label"',
    `<%= config.bin %> <%= command.id %> --label "my-store" --connection-string "${getStoreConnectionStringPlaceholder(
      'configu',
    )}"`,
    `<%= config.bin %> <%= command.id %> --label "my-store" --interactive`,
  ];

  static flags = {
    label: Flags.string({
      description: 'config-store connection label',
      required: true,
      multiple: true,
      char: 'l',
    }),
    // default: Flags.boolean({
    //   description: 'default store to use when --store flag not is specified',
    // }),
    'connection-string': Flags.string({
      description: 'config-store connection string to upsert',
      exclusive: ['interactive'],
      aliases: ['cs'],
      char: 'c',
    }),
    interactive: Flags.boolean({
      description: 'initiate interactive session to upsert config-store',
      exclusive: ['connection-string'],
      char: 'i',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(StoreUpsert);

    let storeConnection = '';
    const isInteractive = !this.config.ci.isCI && (flags.interactive || !flags['connection-string']);
    if (isInteractive) {
      const { connectionString } = await constructStoreFromInteractiveSession();
      storeConnection = connectionString;
    } else if (flags['connection-string']) {
      const { connectionString } = await constructStoreFromConnectionString(flags['connection-string']);
      storeConnection = connectionString; // ? flags['connection-string']
    } else {
      throw new Error('config-store connection parameter is missing');
    }

    // // * if default flag specified or the first upserted store -> set the "default" label
    // if (flags.default || _.isEmpty(this.config.configData.stores)) {
    //   _.set(this.config.configData, `stores.default`, storeConnection);
    // }

    flags.label.forEach((label) => {
      if (!Cfgu.validateNaming(label)) {
        throw new Error(`invalid label name value ${label}`);
      }
      _.set(this.config.configData, `stores.${label}`, storeConnection);
    });

    await this.writeConfigData();
    this.log(`${flags.label.join(', ')} upserted to cli configuration`);
  }
}
