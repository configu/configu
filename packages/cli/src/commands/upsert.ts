import fs from 'node:fs/promises';
import { Command, Option } from 'clipanion';
import * as prompts from '@clack/prompts';
import { log } from '@clack/prompts';
import openEditor from 'open-editor';
import {
  ConfigSet,
  ConfigValue,
  EvaluatedConfigOrigin,
  UpsertCommand,
  UpsertCommandInput,
  UpsertCommandOutput,
  _,
} from '@configu/sdk';
import {
  ConfiguInterface,
  table,
  color,
  path,
  YAML,
  readFile,
  parseJsonFile,
  parseYamlFile,
  parseDotenvFile,
  diff,
} from '@configu/common';
// import { ConfigFormatter, ConfigFormat } from '@configu/formatters';
// import { ConfiguPlatformConfigStoreApprovalQueueError } from '@configu/configu';
import { styleText } from 'node:util';
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
      // eslint-disable-next-line prettier/prettier
      [`Upsert using a .env file`, `$0 upsert --set prod/region-x --from-file .env.prod`],
      // eslint-disable-next-line prettier/prettier
      [`Interactive upsert`, `$0 upsert --set dev/service-a --edit`],
      [
        `Dry run with a combined file and key-value pair`,
        `$0 upsert --store configu --set staging --schema ./schema.cfgu --from-file ./stage.env --from-literal "DEBUG=true" --preview`,
      ],
    ],
  });

  store = Option.String(`--store,--st,-s`, {
    description: `Target [ConfigStore](https://docs.configu.com/introduction/concepts#learn-more-about-configstore). Defaults to [.configu.stores.default](https://docs.configu.com/interfaces/.configu#stores).`,
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

  fromFile = Option.Array(`--from-file,--fs,-f`, {
    description: `Load values from a file or directory. Supports .env, .json, .yaml. Can be repeated.`,
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

  async handleFileInput(files: string[]) {
    const filePromises = files.map(async (file, idx) => {
      const filePath = path.resolve(file);
      const fileExt = path.extname(filePath).slice(1).toLowerCase();
      const fileContents = await readFile(filePath);

      if (fileExt === 'env') {
        return parseDotenvFile(filePath, fileContents);
      }
      if (fileExt === 'json') {
        const contents = parseJsonFile(filePath, fileContents);
        if (_.isArray(contents)) {
          throw new Error(`JSON file at --from-file[${idx}] should contain an object, not an array`);
        }
        return contents;
      }
      if (fileExt === 'yaml' || fileExt === 'yml') {
        const contents = parseYamlFile(filePath, fileContents);
        if (_.isArray(contents)) {
          throw new Error(`YAML file at --from-file[${idx}] should contain an object, not an array`);
        }
        return contents;
      }

      throw new Error(`Unsupported file type: ${fileExt} at --from-file[${idx}]`);
    });
    const fileConfigsArray = await Promise.all(filePromises);

    return _.chain({})
      .merge(...fileConfigsArray)
      .mapValues((value, key) => ({
        set: '',
        key,
        value,
        cfgu: null,
        origin: EvaluatedConfigOrigin.Store,
      }))
      .value() satisfies UpsertCommandInput['pipe'];
  }

  async handleEditorInput(input: UpsertCommandInput) {
    const editorLocalDir = path.join(this.context.paths.cache, 'editor');
    await fs.mkdir(editorLocalDir, { recursive: true });
    const editorTempFile = path.join(
      editorLocalDir,
      `upsert-${Date.now()}.yaml`,
      // `upsert-${Date.now()}.${this.context.interface.cli.editor.format}`,
    );

    const upsertCommand = new UpsertCommand({
      ...input,
      dry: true,
    });
    const upsertResult = await upsertCommand.run();

    // Build a YAMLMap to preserve order and allow comments
    const doc = new YAML.Document({});

    doc.commentBefore = `\
 Configu: Upsert - Temporary Config Edit File
${' '}
 This file was generated by the Configu CLI as part of an "upsert" command.
 Edit the key-value pairs below to modify Configs for the "${input.set.path}" set in the "${input.store.type}" store.
${' '}
 Annotations:
 [const]  = Computed at evaluation. Cannot be edited.
 [lazy]   = Assigned at evaluation. Cannot be edited.
${' '}
 Save and close this file to apply your changes.
 Learn more: https://docs.configu.com`;

    _.chain(upsertResult.result)
      .forEach(({ key, value, cfgu }) => {
        let pairValue = null; // display empty values as empty yaml nodes (nullStr: '')
        if (value !== '') {
          pairValue = ConfigValue.parse(value);
        }

        let comment;
        if (cfgu?.const) {
          pairValue = null;
          comment = ' [const]';
        } else if (cfgu?.lazy) {
          pairValue = null;
          comment = ' [lazy]';
        }
        const valueNode = doc.createNode(pairValue);
        valueNode.comment = comment;

        const pair = doc.createPair(key, valueNode);
        doc.add(pair);
      })
      .value();

    let editorTempFileContents = doc.toString({ nullStr: '' });
    await fs.writeFile(editorTempFile, editorTempFileContents);
    await openEditor([editorTempFile], { wait: true });
    editorTempFileContents = await readFile(editorTempFile);

    return _.chain(YAML.parse(editorTempFileContents))
      .omitBy((value, key) => {
        const cfgu = upsertResult.result[key]?.cfgu || null;
        return cfgu?.const || cfgu?.lazy;
      })
      .mapValues((value) => {
        if (_.isNull(value)) {
          return '';
        }
        return value;
      })
      .value() satisfies UpsertCommandInput['configs'];
  }

  printUpsertReport(input: UpsertCommandInput, result: UpsertCommandOutput) {
    // const oldConfigs = _.chain(result)
    //   .values()
    //   .map(({ key, prev }) => `${key}=${prev}`)
    //   .join('\n')
    //   .value();
    // const newConfigs = _.chain(result)
    //   .values()
    //   .map(({ key, next }) => `${key}=${next}`)
    //   .join('\n')
    //   .value();

    // const diffObject = diff.structuredPatch(
    //   `${store.type}/${set.path}`,
    //   `sdfdsfds`,
    //   oldConfigs,
    //   newConfigs,
    //   // 'asdasd',
    //   // 'vxcvxcvxcv',
    //   // {},
    // );

    // const diffOutput = diffObject.hunks.map((hunk) => {
    //   const header = `@@ ${hunk.oldStart},${hunk.oldLines} ${hunk.newStart},${hunk.newLines} @@`;
    //   const lines = hunk.lines.map((line) => {
    //     if (line.startsWith('-')) {
    //       return color.red(line);
    //     }
    //     if (line.startsWith('+')) {
    //       return color.green(line);
    //     }
    //     return line;
    //   });
    //   return `${header}\n${lines.join('\n')}`;
    // });

    // prompts.note(diffOutput, `${this.prune ? 'Dry ' : ''}Upsert Report ${color.dim(`(${result.length})`)}:`);

    // // const orderedActions = [ConfigDiffAction.Add, ConfigDiffAction.Update, ConfigDiffAction.Delete];
    const data = _.chain(result)
      .values()
      // .sortBy([({ action }) => orderedActions.indexOf(action), 'key'])
      .map((output) => {
        const { key, prev, next, cfgu } = output;

        if (cfgu?.const) {
          return [key, color.dim(`[const]`)];
        }
        if (cfgu?.lazy) {
          return [key, color.dim(`[lazy]`)];
        }

        const valueDiff = diff.diffChars(prev, next).reduce((acc, part) => {
          if (part.added) {
            return `${acc}${color.green(part.value)}`;
          }
          if (part.removed) {
            return `${acc}${color.red(part.value)}`;
          }
          return `${acc}${part.value}`;
        }, '');

        // return [key, valueDiff, prev, next];
        return [key, valueDiff];
      })
      .value();

    prompts.note(
      table(
        [
          [
            `${color.bold(`Key`)} (${data.length})`,
            `${color.bold(`Value`)} (${input.store.type}) (${input.set.label})`,
          ],
          ...data,
        ],
        {
          columns: [{ width: 24, wrapWord: true }, { wrapWord: true }],
        },
      ),
      `${input.dry ? 'Dry ' : ''}Diff Report`,
    );
  }

  async execute() {
    await this.init();

    const spinner = prompts.spinner();
    spinner.start(`Initializing upsert`);
    try {
      spinner.message(`Constructing store`);
      const store = await ConfiguInterface.getStoreInstance(this.store);

      spinner.message(`Constructing set`);
      const set = new ConfigSet(this.set);

      spinner.message(`Constructing schema`);
      const schema = await ConfiguInterface.getSchemaInstance(this.schema);

      let pipe = this.context.pipe as UpsertCommandInput['pipe'];
      let configs = {} as UpsertCommandInput['configs'];

      if (this.fromFile) {
        spinner.message(`Loading configs from file`);
        const filePipe = await this.handleFileInput(this.fromFile);
        spinner.message(`Merging configs from --from-files`);
        pipe = _.merge({}, pipe, filePipe);
      }

      if (this.fromLiteral) {
        spinner.message(`Loading configs from literal`);
        const literalConfigs = this.handleLiteralInput(this.fromLiteral);
        spinner.message(`Merging configs from --from-literal`);
        configs = _.merge({}, configs, literalConfigs);
      }

      if (this.edit) {
        spinner.message(`Opening editor`);
        const editorConfigsPromise = this.handleEditorInput({
          store,
          set,
          schema,
          configs,
          pipe,
          delete: this.prune,
        });
        spinner.message(`Waiting for editor to close`);
        const editorConfigs = await editorConfigsPromise;
        spinner.message(`Merging configs from --edit`);
        configs = editorConfigs;
        pipe = {};
      }

      spinner.message(`${this.preview ? 'Dry' : ''} Upserting Configs`);
      const upsertInput = {
        store,
        set,
        schema,
        configs,
        pipe,
        delete: this.prune,
        dry: this.preview,
      };
      const upsertCommand = new UpsertCommand(upsertInput);
      const { result, metadata } = await upsertCommand.run();
      spinner.stop(`Configs upsert succeeded`, 0);

      this.printUpsertReport(upsertInput, result);
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
