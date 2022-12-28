import { Flags, CliUx } from '@oclif/core';
import _ from 'lodash';
import { ConfigSchema } from '@configu/node';
import { getStoreConnectionStringPlaceholder, StoreType, STORE_TYPE } from '@configu/lib';
import { BaseCommand } from '../../base';
import { constructStoreFromConnectionString, constructStoreFromInteractiveSession } from '../../helpers/stores';

export default class StoreUpsert extends BaseCommand {
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
    const { flags } = await this.parse(StoreUpsert);

    const labels = _.compact(flags.label ?? [flags.type]);
    if (_.isEmpty(labels)) {
      throw new Error(`store label is missing`);
    }

    let storeConnection = '';
    const isInteractive = !this.config.ci.isCI && (flags.interactive || !flags['connection-string']);
    if (isInteractive) {
      const { connectionString } = await constructStoreFromInteractiveSession(flags.type as StoreType | undefined);
      storeConnection = connectionString;
    } else if (flags['connection-string']) {
      const { connectionString } = await constructStoreFromConnectionString(flags['connection-string']);
      storeConnection = connectionString; // ? flags['connection-string']
    } else {
      throw new Error('config-store connection parameter is missing');
    }

    labels.forEach((label) => {
      if (!ConfigSchema.validateNaming(label)) {
        throw new Error(`invalid label name value ${label}`);
      }
      _.set(this.config.configData, `stores.${label}`, storeConnection);
    });

    await this.writeConfigData();
    this.log(`${labels.join(', ')} upserted to cli configuration`);
  }
}
