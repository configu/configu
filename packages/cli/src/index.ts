import { Cli, Builtins, BaseContext } from 'clipanion';
import process from 'node:process';
import { log } from '@clack/prompts';
import { debug, ConfiguInterface, ConfiguFileInterfaceConfig } from '@configu/common';

import packageJson from '../package.json' with { type: 'json' };

// CLI interface Commands
import { InstallCommand } from './commands/install';
import { PurgeCommand } from './commands/purge';

// Config Management Commands
import { CliUpsertCommand } from './commands/upsert';
import { CliEvalCommand } from './commands/eval';
import { CliExportCommand } from './commands/export';

// Misc Commands
// import { InitCommand } from './commands/init';
// import { UpdateCommand } from './commands/update';
import { LoginCommand } from './commands/login';
import { RunCommand } from './commands/run';

// Inspired by
// https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-cli/sources/lib.ts#L186
// https://github.com/nodejs/corepack/blob/main/sources/main.ts#L40

export type RunContext = BaseContext;

export const checkForUpdates = async (config: ConfiguFileInterfaceConfig) => {
  // todo: implement update check using packageJson and configuFilesApi
};

export async function run(argv: string[]) {
  debug('argv', argv);

  const cli = new Cli({
    binaryName: 'configu',
    binaryLabel: packageJson.name,
    binaryVersion: packageJson.version,
  });

  // Enables the BaseCommand catch override functionality
  const originalErrorMethod = cli.error.bind(cli);
  cli.error = (...args) => {
    if (typeof args[0] === 'number') {
      return '';
    }
    return originalErrorMethod(...args);
  };

  function unexpectedTerminationHandler() {
    log.error(
      `${cli.binaryName} is terminating due to an unexpected empty event loop.\nPlease report this issue at https://github.com/configu/configu/issues.`,
    );
  }
  process.once(`beforeExit`, unexpectedTerminationHandler);
  process.on('exit', (code) => {
    debug(`exiting ...`, code);
  });

  try {
    await ConfiguInterface.initEnvironment();
    if (ConfiguInterface.context.isExecFromHome) {
      await checkForUpdates(ConfiguInterface.context.interface);
    }

    cli.register(Builtins.HelpCommand);
    cli.register(Builtins.VersionCommand);

    cli.register(InstallCommand);
    cli.register(PurgeCommand);

    cli.register(CliUpsertCommand);
    cli.register(CliEvalCommand);
    cli.register(CliExportCommand);

    // cli.register(InitCommand);
    // cli.register(UpdateCommand);
    cli.register(LoginCommand);
    cli.register(RunCommand);

    process.exitCode = 42;
    // cli.run() never throws
    // https://github.com/arcanis/clipanion/blob/master/sources/advanced/Cli.ts#L483
    process.exitCode = await cli.run(argv);
  } catch (error) {
    log.error(error.message);
    process.exitCode = 1;
  } finally {
    process.off(`beforeExit`, unexpectedTerminationHandler);
    debug('Exiting with code:', process.exitCode);
  }
}
