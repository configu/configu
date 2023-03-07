import { Flags } from '@oclif/core';
import _ from 'lodash';
import { NAME } from '@configu/ts';
import { getStoreConnectionStringPlaceholder, StoreType, STORE_TYPE } from '@configu/lib';
import { BaseCommand } from '../../base';
import { constructStoreFromConnectionString, constructStoreFromInteractiveSession } from '../../helpers/stores';

export default class StoreUpsert extends BaseCommand<typeof StoreUpsert> {
  static description = 'creates/updates config-store connections';

  static examples = [
    `<%= config.bin %> <%= command.id %> --label "my-store" --connection-string "${getStoreConnectionStringPlaceholder(
      'configu',
    )}"`,
    '<%= config.bin %> <%= command.id %> --label "my-store" -l "other-label"',
    `<%= config.bin %> <%= command.id %> --label "my-store" --interactive`,
    `<%= config.bin %> <%= command.id %> --type "configu"`,
  ];

  static flags = {
    label: Flags.string({
      description: 'config-store connection label',
      multiple: true,
      char: 'l',
    }),
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
    type: Flags.string({
      description: 'config-store type',
      exclusive: ['connection-string'],
      options: STORE_TYPE,
    }),
  };

  public async run(): Promise<void> {
    const labels = _.compact(this.flags.label ?? [this.flags.type]);
    if (_.isEmpty(labels)) {
      throw new Error(`store label is missing`);
    }

    let storeConnection = '';
    const isInteractive = !this.config.ci.isCI && (this.flags.interactive || !this.flags['connection-string']);
    if (isInteractive) {
      const { connectionString } = await constructStoreFromInteractiveSession(this.flags.type as StoreType | undefined);
      storeConnection = connectionString;
    } else if (this.flags['connection-string']) {
      const { connectionString } = await constructStoreFromConnectionString(this.flags['connection-string']);
      storeConnection = connectionString;
    } else {
      throw new Error('config-store connection parameter is missing');
    }

    labels.forEach((label) => {
      if (!NAME(label)) {
        throw new Error(`invalid label name value ${label}`);
      }
      _.set(this.config.configData, `stores.${label}`, storeConnection);
    });

    await this.writeConfigData();
    this.log(`${labels.join(', ')} upserted to cli configuration`);
  }
}
