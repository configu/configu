import { Command, Option } from 'clipanion';
import { ExportCommand as BaseExportCommand } from '@configu/sdk';
import { BaseCommand } from './base';

export class ExportCommand extends BaseCommand {
  static override paths = [['export'], ['ex']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: `Export \`Configs\` as configuration data in various modes`,
    // details: `
    //   A longer description of the command with some \`markdown code\`.

    //   Multiple paragraphs are allowed. Clipanion will take care of both reindenting the content and wrapping the paragraphs as needed.
    // `,
    // examples: [
    //   [`A basic example`, `$0 my-command`],
    //   [`A second example`, `$0 my-command --with-parameter`],
    // ],
  });

  // name = Option.String(''

  async execute() {
    await this.init();

    const pipe = await this.readPreviousEvalCommandOutput();
    if (!pipe) {
      this.context.stdio.warn('no configuration was fetched');
      return;
    }

    const exportCommand = new BaseExportCommand({ pipe });
    const { result } = await exportCommand.run();

    process.stdout.write(result);
  }
}
