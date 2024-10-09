/* NOTE:
 * @configu/cli is currently work in progress and is not yet released.
 * It expected to be released by the end of October 2024.
 * Latest released code can be found at: https://github.com/configu/configu/tree/52cee9c41fb03addc4c0983028e37df42945f5b7/packages/cli
 */

import { BaseContext, Builtins, Cli } from 'clipanion';
import * as stdenv from 'std-env';
import { consola } from 'consola';
import packageJson from '../package.json' with { type: 'json' };

// import { HelloCommand } from './commands/hello';
import { EvalCommand } from './commands/eval';
import { ExportCommand } from './commands/export';

export type CustomContext = BaseContext & { stdenv: typeof stdenv; stdio: typeof consola };

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

  cli.register(EvalCommand);
  cli.register(ExportCommand);

  const context = {
    ...Cli.defaultContext,
    stdenv,
    stdio: consola,
  };

  const code = await cli.run(argv, context);

  if (code !== 0) {
    process.exitCode ??= code;
  }
}
