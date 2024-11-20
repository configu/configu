/* NOTE:
 * @configu/cli is currently work in progress and is not yet released.
 * It expected to be released by the end of October 2024.
 * Latest released code can be found at: https://github.com/configu/configu/tree/52cee9c41fb03addc4c0983028e37df42945f5b7/packages/cli
 */

import { BaseContext, Builtins, Cli } from 'clipanion';
import { consola } from 'consola';
import packageJson from '../package.json' with { type: 'json' };

// import { HelloCommand } from './commands/hello';
import { CliEvalCommand } from './commands/eval';
import { CliExportCommand } from './commands/export';
import { CliUpsertCommand } from './commands/upsert';

import { LoginCommand } from './commands/login';
import { RunCommand } from './commands/run';
// todo: finalize those commands
import { InitCommand } from './commands/init';
import { TestCommand } from './commands/test';
import { GenerateCommand } from './commands/generate';

export type CustomContext = BaseContext & { stdio: typeof consola };

export async function run(argv: string[]) {
  // consola.wrapAll();

  // const [firstArg, ...restArgs] = argv;

  const cli = new Cli({
    binaryLabel: packageJson.name,
    binaryName: 'configu',
    binaryVersion: packageJson.version,
  });

  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  cli.register(CliEvalCommand);
  cli.register(CliExportCommand);
  cli.register(CliUpsertCommand);
  // cli.register(InitCommand);
  cli.register(LoginCommand);
  cli.register(RunCommand);
  // cli.register(TestCommand);
  // cli.register(GenerateCommand);

  const context = {
    ...Cli.defaultContext,
    stdio: consola,
  };

  const code = await cli.run(argv, context);

  if (code !== 0) {
    process.exitCode ??= code;
  }
}
