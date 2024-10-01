import { BaseContext, Builtins, Cli } from 'clipanion';

import packageJson from '../package.json' with { type: 'json' };

import { HelloCommand } from './commands/hello';

export async function run(argv: string[]) {
  // const [firstArg, ...restArgs] = argv;

  const cli = new Cli({
    binaryLabel: `Configu`,
    binaryName: packageJson.cli.bin,
    binaryVersion: packageJson.version,
  });

  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  cli.register(HelloCommand);

  const context = {
    ...Cli.defaultContext,
    cwd: process.cwd(),
  };

  const code = await cli.run(argv, context);

  if (code !== 0) {
    process.exitCode ??= code;
  }
}
