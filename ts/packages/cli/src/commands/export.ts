import { Flags } from '@oclif/core';
import _ from 'lodash';
import { paramCase } from 'change-case';
import { EvaluatedConfigs, EvaluatedConfigsArray, TMPL } from '@configu/ts';
import { Set, Cfgu, EvalCommand } from '@configu/node';
import {
  CONFIG_FORMAT_TYPE,
  formatConfigs,
  ConfigFormat,
  CONFIG_SYNCHRONIZER_TYPE,
  ConfigSynchronizer,
} from '@configu/lib';
import { BaseCommand } from '../base';
import { constructStoreFromUrl } from '../helpers/stores';
import { SYNCHRONIZERS_FLAGS_DICT, syncIntegration } from '../helpers/synchronizers';

export const NO_CONFIGS_WARNING_TEXT = 'no configuration was fetched';
export const CONFIG_EXPORT_RUN_DEFAULT_ERROR_TEXT = 'could not export configurations';
export default class Export extends BaseCommand {
  static description = 'tbd';

  static examples = ['<%= config.bin %> <%= command.id %> tbd'];

  static flags = {
    store: Flags.string({ multiple: true, description: 'tbd', default: ['default'] }),
    defaults: Flags.boolean({ description: 'tbd' }),

    set: Flags.string({ description: 'tbd', default: '' }),
    schema: Flags.string({ required: true, multiple: true, description: 'tbd' }),

    label: Flags.string({ description: 'tbd' }),
    empty: Flags.boolean({
      description: 'omits all non-value configurations in the current set.',
      default: true,
      allowNo: true,
    }),

    format: Flags.string({
      description: 'sets the format in which configurations will be received',
      options: CONFIG_FORMAT_TYPE,
      exclusive: ['template', 'source', 'sync'],
    }),

    template: Flags.string({
      description: 'inject configurations into handlebars templates',
      exclusive: ['format', 'source', 'sync'],
    }),
    'template-input': Flags.string({
      description: 'tbd',
      options: ['object', 'array'],
      dependsOn: ['template'],
    }),

    // * https://medium.com/@charles.wautier/pipe-a-dotenv-in-a-process-with-the-shell-f9c663ff99a0
    // * (set -a; source .env; set +a; the command)
    // * https://docs.doppler.com/docs/accessing-secrets#how-do-i-export-doppler-secrets-into-the-current-shell
    // * (set -a; source <(configu export ... --source); set +a && the command)
    source: Flags.boolean({
      description: 'source configurations to the current shell',
      exclusive: ['format', 'template', 'sync'],
    }),

    sync: Flags.string({
      description: 'syncs configurations to a 3rd party runtime environment',
      options: CONFIG_SYNCHRONIZER_TYPE,
      exclusive: ['format', 'template', 'source'],
    }),
    ...SYNCHRONIZERS_FLAGS_DICT,
  };

  printStdout(finalConfigData: string) {
    this.log(finalConfigData, 'stdout');
  }

  async exportConfigs(configs: EvaluatedConfigs, label: string) {
    if (_.isEmpty(configs)) {
      this.warn(NO_CONFIGS_WARNING_TEXT);
      return;
    }
    const { flags } = await this.parse(Export);

    if (flags.template) {
      const templateContent = await this.readFile(flags.template);
      let templateContext: EvaluatedConfigs | EvaluatedConfigsArray = configs;
      if (flags['template-input'] === 'array') {
        templateContext = _(configs)
          .entries()
          .map(([key, value]) => ({
            key,
            value,
          }))
          .value();
      }
      const compiledContent = TMPL.render(templateContent, templateContext);
      this.printStdout(compiledContent);
      return;
    }

    if (flags.source) {
      const formattedConfigs = formatConfigs({ format: 'Dotenv', json: configs, label });
      this.printStdout(formattedConfigs);
      return;
    }

    if (flags.sync) {
      await syncIntegration({ synchronizer: flags.sync as ConfigSynchronizer, configs, flags });
      return;
    }

    const formattedConfigs = formatConfigs({
      format: (flags.format as ConfigFormat) ?? 'JSON',
      json: configs,
      label,
    });
    this.printStdout(formattedConfigs);
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Export);

    if (flags.defaults) {
      flags.store = ['noop://-'];
      flags.set = '';
    }

    const storePromises = flags.store.map(async (storeFlag) => {
      const storeUrl = this.config.configData.stores?.[storeFlag] ?? storeFlag;
      const { store } = await constructStoreFromUrl(storeUrl);
      return store;
    });
    const store = await Promise.all(storePromises);

    const set = new Set(flags.set);
    const schema = flags.schema.map((schemaFlag) => {
      return new Cfgu(schemaFlag);
    });

    let { data } = await new EvalCommand({
      store,
      set,
      schema,
    }).run();

    if (!flags.empty) {
      data = _.omitBy(data, (v) => v === '');
    }

    const label = flags.label ?? paramCase(`${set.path} ${_.map(schema, 'name')}`);

    await this.exportConfigs(data, label);
  }
}
