import fs from 'node:fs/promises';
import { Command, Option } from 'clipanion';
import * as prompts from '@clack/prompts';
import openEditor from 'open-editor';
import { ConfigSet, ConfigValue, UpsertCommand, UpsertCommandInput, _ } from '@configu/sdk';
import { ConfiguInterface, table, color, path, YAML, readFile, diffChars } from '@configu/common';
import { ConfigFormatter, ConfigFormat } from '@configu/formatters';
// import { ConfiguPlatformConfigStoreApprovalQueueError } from '@configu/configu';
import { BaseCommand } from './base';

export class CliUpsertCommand extends BaseCommand {
  static override paths = [['upsert']];

  static override usage = Command.Usage({
    category: `Config Operations`,
    description: `Create or update Configs in a ConfigStore.`,
    details: `
      Write new or updated \`Configs\` into a \`ConfigStore\`, using a target \`ConfigSet\` and \`ConfigSchema\`.

      You can provide values in multiple ways:
      - From a file or directory (\`--from-file\`)
      - As inline key=value pairs (\`--from-literal\`)
      - Through an interactive editor (\`--edit\`)
      - Delete schema-defined keys not explicitly provided (\`--prune\`)

      Input precedence: \`--prune\` < \`--from-file\` < \`--from-literal\` < \`--edit\`

      Use \`--preview\` to simulate changes without applying them.
    `,
    examples: [
      [
        `Upsert using inline key-value pairs`,
        `$0 upsert --store configu --set prod --from-literal "PORT=443" --from-literal "DEBUG=false"`,
      ],
      [`Upsert using a .env file`, `$0 upsert --set prod/region-x --from-file .env.prod`],
      [`Interactive upsert`, `$0 upsert --set dev/service-a --edit`],
      [
        `Dry run with a combined file and key-value pair`,
        `$0 upsert --store configu --set staging --schema ./schema.cfgu --from-file ./stage.env --from-literal "DEBUG=true" --preview`,
      ],
    ],
  });

  store = Option.String(`--store,--st,-s`, {
    description: `Target [ConfigStore](https://docs.configu.com/introduction/concepts#learn-more-about-configstore).Defaults to [.configu.stores.default](https://docs.configu.com/interfaces/.configu#stores).`,
  });

  set = Option.String(`--set,--se,-t`, {
    description: `Target [ConfigSet](https://docs.configu.com/introduction/concepts#learn-more-about-configset). Defaults to root ("/").`,
  });

  schema = Option.String(`--schema,--sc,-m`, {
    description: `Path, glob or alias defined in [.configu.schemas](https://docs.configu.com/interfaces/.configu#schemas) referencing a [ConfigSchema](https://docs.configu.com/introduction/concepts#learn-more-about-configschema). Auto-detected from files in the current directory.`,
  });

  fromLiteral = Option.Array(`--from-literal,--fl,--kv,-l`, {
    description: `Provide key=value pairs inline. Can be repeated.`,
  });

  fromFile = Option.String(`--from-file,--fs,-f`, {
    description: `Load values from a file or directory. Supports .env, .json, .yaml.`,
  });

  edit = Option.Boolean(`--edit,--interactive,-i`, false, {
    description: `Open a text editor to input values.`,
  });

  prune = Option.Boolean(`--prune,--delete`, false, {
    description: `Delete all schema-defined keys not explicitly provided in this run.`,
  });

  preview = Option.Boolean(`--preview,--dry`, false, {
    description: `Simulate the result without applying changes.`,
  });

  validate = Option.Boolean(`--validate`, true, {
    description: `Enable schema validation (default: true). Use --no-validate to skip.`,
  });

  async execute() {
    await this.init();

    const spinner = prompts.spinner();
    spinner.start(`Initializing ${this.constructor.name}`);
    try {
      spinner.message(`Constructing store`);
      const store = await ConfiguInterface.getStoreInstance(this.store);

      spinner.message(`Constructing set`);
      const set = new ConfigSet(this.set);

      spinner.message(`Constructing schema`);
      const schema = await ConfiguInterface.getSchemaInstance(this.schema);

      let configs = {} as UpsertCommandInput['configs'];

      if (this.fromLiteral) {
        spinner.message(`Parsing kv flag`);
        configs = this.reduceKVFlag(this.fromLiteral);
      }

      if (this.edit) {
        spinner.message(`Opening editor`);
        const editorLocalDir = path.join(this.context.paths.cache, 'editor');
        await fs.mkdir(editorLocalDir, { recursive: true });

        const editorTempFile = path.join(
          editorLocalDir,
          // `upsert-${Date.now()}.${this.context.interface.cli.editor.format}`,
          `upsert-${Date.now()}.yaml`,
        );

        const upsertCommand = new UpsertCommand({
          store,
          set,
          schema,
          configs,
          pipe: this.context.pipe,
          delete: this.prune,
          dry: true,
        });
        const upsertResult = await upsertCommand.run();
        const editorTempFileData = _.chain(upsertResult.result)
          .keyBy('key')
          .mapValues(({ value }) => ConfigValue.parse(value))
          .value();
        let editorTempFileContents = YAML.stringify(editorTempFileData);

        await fs.writeFile(editorTempFile, editorTempFileContents);
        spinner.message(`Waiting for editor to close`);
        await openEditor([editorTempFile], { wait: true });
        editorTempFileContents = await readFile(editorTempFile);
        configs = YAML.parse(editorTempFileContents);
        this.context.pipe = undefined;
      }

      spinner.message(`${this.preview ? 'Dry ' : ''}Upserting Configs`);
      const upsertCommand = new UpsertCommand({
        store,
        set,
        schema,
        configs,
        pipe: this.context.pipe,
        delete: this.prune,
        dry: this.preview,
      });
      const { result } = await upsertCommand.run();

      spinner.stop(`Configs upserted successfully`, 0);

      // const orderedActions = [ConfigDiffAction.Add, ConfigDiffAction.Update, ConfigDiffAction.Delete];
      const data = _.chain(result)
        .values()
        // .sortBy([({ action }) => orderedActions.indexOf(action), 'key'])
        .map((output) => {
          const { key, prev, next } = output;

          const diff = diffChars(prev, next).reduce((acc, part) => {
            if (part.added) {
              return `${acc}${color.green(part.value)}`;
            }
            if (part.removed) {
              return `${acc}${color.red(part.value)}`;
            }
            return `${acc}${part.value}`;
          }, '');

          return [key, diff, prev, next];
        })
        .value();
      const dataWithHeaders = [['Key', 'Value Diff', 'Previous Value', 'Next Value'], ...data];
      prompts.note(
        table(dataWithHeaders, { columns: [{}, {}, { width: 20, wrapWord: true }, { width: 20, wrapWord: true }] }),
        `${this.prune ? 'Dry ' : ''}Upsert Report ${color.dim(`(${data.length})`)}:`,
      );
    } catch (error) {
      //   // if (error instanceof ConfiguPlatformConfigStoreApprovalQueueError) {
      //   //   // * print warning message with queue url highlighted with an underline
      //   //   const warningMessage = error.message.replace(error.queueUrl, `\u001B[4m${error.queueUrl}\u001B[0m`);
      //   //   this.context.stdio.warn(warningMessage);
      //   // } else {
      //   //   this.context.stdio.error(error.message);
      //   // }
      // this.context.stdio.error(error.message);
      spinner.stop(`Configs upsert failed`, 1);
      throw error;
    }
  }
}
