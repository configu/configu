import { Flags } from '@oclif/core';
import _ from 'lodash';
import { EvaluatedConfigsArray } from '@configu/ts';
import { Set, Cfgu, UpsertCommand } from '@configu/node';
import { extractConfigs } from '@configu/lib';
import { BaseCommand } from '../base';
import { constructStoreFromUrl } from '../helpers/stores';

export default class Upsert extends BaseCommand {
  static description = 'tbd';

  static examples = ['<%= config.bin %> <%= command.id %> tbd'];

  static flags = {
    store: Flags.string({ description: 'tbd', default: 'default' }),
    set: Flags.string({ required: true, description: 'tbd' }),
    schema: Flags.string({ required: true, description: 'tbd' }),

    config: Flags.string({ exclusive: ['import'], multiple: true, description: 'tbd' }),
    import: Flags.string({
      exclusive: ['config'],
      description: 'use this flag to import an existing .env file and create configs from it',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Upsert);

    const storeUrl = this.config.configData.stores?.[flags.store] ?? flags.store;
    const { store } = await constructStoreFromUrl(storeUrl);

    const set = new Set(flags.set);
    const schema = new Cfgu(flags.schema);

    let configs: EvaluatedConfigsArray = [];

    if (flags.config) {
      configs = flags.config.map((pair) => {
        const [key, value] = pair.split('=');
        if (!key) {
          throw new Error('invalid config flag');
        }
        return { key, value };
      });
    }

    if (flags.import) {
      const fileContent = await this.readFile(flags.import);
      const extractedConfigs = extractConfigs({
        filePath: flags.import,
        fileContent,
      });
      configs = extractedConfigs.map((ex) => _.pick(ex, ['key', 'value']));
    }

    await new UpsertCommand({
      store,
      set,
      schema,
      configs,
    }).run();
  }
}
