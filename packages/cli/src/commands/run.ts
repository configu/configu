import { Command, Option } from 'clipanion';
import { BaseCommand } from './base';

export class RunCommand extends BaseCommand {
  static override paths = [['run']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: `Run a script from the scripts section in the .<%= config.bin %> file`,
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
    throw new Error('Not implemented');
  }
}
