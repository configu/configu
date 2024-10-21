import { Command, Option } from 'clipanion';
import { cp, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pascalCase } from 'change-case';
import { BaseCommand } from './base';

export class GenerateCommand extends BaseCommand {
  static override paths = [['generate'], ['gen']];

  static override usage = Command.Usage({
    // category: `My category`,
    description: `Generate a boilerplated project for a custom \`ConfigStore\``,
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
    description: `Location to generate the \`ConfigStore\` project`,
    required: true,
  });

  name = Option.String('--name,--na', {
    description: `Name of the \`ConfigStore\``,
    required: true,
  });

  async execute() {
    await this.init();

    console.log(`Copying from ${join(dirname(import.meta.dirname), 'integration_template')} to ${this.directory}`);
    console.log('Generating project...');
    await this.generateBoilerplate();
    await this.overrideTemplates();
    await this.installDependencies();
  }

  private async generateBoilerplate() {
    console.log(`Copying project boilerplate...\r`);
    await cp(join(dirname(import.meta.dirname), 'integration_template'), this.directory, { recursive: true });
    console.log(`Copying project boilerplate...done`);
  }

  private async overrideTemplates() {
    console.log(`Overriding to match your selected name...\r`);
    rename(join(this.directory, 'src', '{{name}}.ts'), join(this.directory, 'src', `${this.name}.ts`));
    await this.rewriteTemplateFile(join(this.directory, 'src', `${this.name}.ts`));
    await this.rewriteTemplateFile(join(this.directory, `package.json`));
    console.log(`Overriding to match your selected name...done`);
  }

  private async rewriteTemplateFile(path: string) {
    const content = await readFile(path, 'utf-8');
    const newContent = content.replaceAll('{{name}}', this.name).replaceAll('{{name:pascal}}', pascalCase(this.name));
    await writeFile(path, newContent, 'utf-8');
  }

  private async installDependencies() {
    console.log(`Installing dependencies...\r`);
    spawnSync('pnpm', ['install'], { cwd: this.directory, stdio: 'inherit' });
  }
}
