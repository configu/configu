import { Command, Option } from 'clipanion';
import { readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pascalCase } from 'change-case';
import tiged from 'tiged';
import { BaseCommand } from './base';

export class GenerateCommand extends BaseCommand {
  static override paths = [['generate'], ['gen']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: 'Generate a boilerplated project for a custom `ConfigStore`',
    // details: `
    //   A longer description of the command with some \`markdown code\`.

    //   Multiple paragraphs are allowed. Clipanion will take care of both reindenting the content and wrapping the paragraphs as needed.
    // `,
    // examples: [
    //   [`A basic example`, `$0 my-command`],
    //   [`A second example`, `$0 my-command --with-parameter`],
    // ],
  });

  directory = Option.String('--dir,--di', {
    description: 'Location to generate the `ConfigStore` project',
    required: true,
  });

  name = Option.String('--name,--na', {
    description: 'Name of the `ConfigStore`',
    required: true,
  });

  async execute() {
    await this.init();
    this.context.stdio.info(`Generating project in ${this.directory}`);
    await this.downloadProjectTemplate();
    await this.prepareProjectFiles(this.directory);
    this.context.stdio.success('Project setup complete.');
    await this.showNextInstructions();
  }

  private async downloadProjectTemplate() {
    this.context.stdio.start('Downloading project template');
    const emitter = tiged('configu/configu/packages/cli/src/integration_template', {
      disableCache: true,
      force: true,
      verbose: true,
    });
    await emitter.clone(this.directory);
    this.context.stdio.success('Complete');
  }

  private async prepareProjectFiles(startPath: string) {
    this.context.stdio.start('Preparing your project');
    const files = await readdir(startPath, { withFileTypes: true });
    await Promise.all(
      files.map(async (file) => {
        if (file.isDirectory()) {
          await this.prepareProjectFiles(join(startPath, file.name));
        } else {
          await this.rewriteTemplateFile(join(startPath, file.name));
        }
        if (/.*\{\{name(:.*){0,1}\}\}.*/.test(file.name)) {
          await rename(join(startPath, file.name), join(startPath, this.rewriteTemplated(file.name)));
        }
      }),
    );
    this.context.stdio.success('Complete');
  }

  private async rewriteTemplateFile(path: string) {
    const content = await readFile(path, 'utf-8');
    await writeFile(path, this.rewriteTemplated(content), 'utf-8');
  }

  private rewriteTemplated(content: string): string {
    return content.replaceAll('{{name}}', this.name).replaceAll('{{name:pascal}}', pascalCase(this.name));
  }

  private async showNextInstructions() {
    this.context.stdio.box(`Next steps:
- Go to your new project directory: ${this.directory}
- Run \`pnpm install\` to install dependencies
  - Alternatively, use any package manager you prefer
- Start writing your integration in \`src/${this.name}.ts\`
`);
  }
}
