import { Command, Option } from 'clipanion';
import { Context } from './base';

export class HelloCommand extends Command<Context> {
  static override paths = [['hello']];

  static override usage = Command.Usage({
    category: `My category`,
    description: `A small description of the command.`,
    details: `
      A longer description of the command with some \`markdown code\`.

      Multiple paragraphs are allowed. Clipanion will take care of both reindenting the content and wrapping the paragraphs as needed.
    `,
    examples: [
      [`A basic example`, `$0 my-command`],
      [`A second example`, `$0 my-command --with-parameter`],
    ],
  });

  name = Option.String();

  async execute() {
    this.context.stdio.info('Hello', `Hello ${this.name}!`);
    this.context.stdout.write(`Hello ${this.name}!\n`);
  }
}
