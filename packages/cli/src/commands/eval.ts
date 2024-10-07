import { Command, Option } from 'clipanion';
import { Context } from './base';

export class EvalCommand extends Command<Context> {
  static override paths = [['eval'], ['ev']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: `Fetch \`Configs\` from \`ConfigStore\` on demand based on \`ConfigSet\` and \`ConfigSchema\``,
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

  async execute() {}
}
