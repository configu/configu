import { Option } from 'clipanion';
import * as t from 'typanion';
import sea from 'node:sea';
import process from 'node:process';
import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import stream from 'node:stream/promises';
import { addDirToEnvPath } from '@pnpm/os.env.path-extender';
import * as tar from 'tar';
import Zip from 'adm-zip';
import * as prompts from '@clack/prompts';
import { debug, path, stdenv, semver, color, configuFilesApi, pathExists } from '@configu/common';
import { BaseCommand } from './base';

export class SetupCommand extends BaseCommand {
  static override paths = [['setup']];
  // hide the command from the help menu
  static override usage = undefined;

  global = Option.Boolean('--global', {
    description: `Add the CONFIGU_HOME directory to the PATH environment variable`,
  });

  version = Option.String('--version', {
    description: `The version to install`,
    env: 'CONFIGU_VERSION',
  });

  purge = Option.Boolean('--purge', {
    description: `Purge the cache directory`,
  });

  static override schema = [t.hasMutuallyExclusiveKeys(['global', 'version'], { missingIf: 'undefined' })];

  private nextExecPath = '';

  async execute() {
    const isExecutable = sea.isSea() && process.execPath.endsWith('configu');
    const isGlobalOrVersionFlag = this.global || Boolean(this.version);
    if (!isExecutable && isGlobalOrVersionFlag) {
      prompts.log.error('Setup is only supported for executable');
    }

    prompts.intro(`${color.inverse(' Configu Setup ')}`);
    await prompts.tasks([
      {
        title: 'Initializing setup',
        task: async (message) => {
          await this.init();
          return 'Setup initialized';
        },
      },
      {
        enabled: this.global,
        title: 'Copying bin to home directory',
        task: async (message) => {
          const binDir = path.join(this.context.paths.bin, this.cli.binaryVersion as string);
          await fs.mkdir(binDir, { recursive: true });
          this.nextExecPath = path.join(binDir, this.cli.binaryName);

          await fs.cp(process.execPath, this.nextExecPath, { force: true });
          return 'Bin copied to home directory';
        },
      },
      {
        enabled: Boolean(this.version),
        title: `Installing ${this.version} version`,
        task: async (message) => {
          const canUpdate = this.context.isGlobal;
          if (!canUpdate) {
            throw new Error('Version flag is only supported for global setup');
          }

          // default to latest version
          let version = this.version ?? 'latest';
          // handle channel based version
          if (['latest', 'next'].includes(version)) {
            const channelVersion = await configuFilesApi(`/cli/channels/${version}`);
            if (!channelVersion) {
              throw new Error(`Channel ${version} not found`);
            }
            version = channelVersion.data;
          }
          if (!version.startsWith('v')) {
            version = `v${version}`;
          }
          if (!semver.valid(version)) {
            throw new Error(`Invalid version ${version}`);
          }

          const binDir = path.join(this.context.paths.bin, version);
          await fs.mkdir(binDir, { recursive: true });
          this.nextExecPath = path.join(binDir, 'configu');

          const isExecExists = await pathExists(this.nextExecPath);
          if (isExecExists) {
            return 'Version already installed';
          }

          const hostDist = `${process.platform.replace('32', '')}-${process.arch}`;
          const archiveExt = !stdenv.isWindows ? 'tar.gz' : 'zip';
          const remoteArchive = await configuFilesApi({
            method: 'GET',
            url: `/cli/versions/${version}/configu-${version}-${hostDist}.${archiveExt}`,
            responseType: 'stream',
          });
          const archivePath = path.join(binDir, `configu.${archiveExt}`);
          const localArchive = await fs.open(archivePath);
          const writer = localArchive.createWriteStream();
          remoteArchive.data.pipe(writer);
          await stream.finished(writer);
          if (archiveExt === 'tar.gz') {
            await tar.x({ file: archivePath, gzip: true, cwd: binDir });
          } else {
            const zip = new Zip(archivePath);
            zip.extractAllTo(binDir, true);
          }
          return 'Version installed';
        },
      },
      {
        enabled: isGlobalOrVersionFlag,
        title: 'Creating bin shims',
        // https://github.com/pnpm/pnpm/blob/main/packages/plugin-commands-setup/src/setup.ts#L67
        task: async (message) => {
          // windows can also use shell script via mingw or cygwin so no filter
          const shellScript = ['#!/bin/sh', `exec ${this.nextExecPath} "$@"`].join('\n');
          await fs.writeFile(path.join(this.context.paths.home, 'configu'), shellScript, { mode: 0o755 });

          if (stdenv.isWindows) {
            const batchScript = ['@echo off', `${this.nextExecPath} %*`].join('\n');
            await fs.writeFile(path.join(this.context.paths.home, 'configu.cmd'), batchScript, { mode: 0o755 });

            const powershellScript = `${this.nextExecPath} $args`;
            await fs.writeFile(path.join(this.context.paths.home, 'configu.ps1'), powershellScript, { mode: 0o755 });
          }
          return 'Bin shims created';
        },
      },
      {
        enabled: isGlobalOrVersionFlag,
        title: 'Adding bin to PATH',
        task: async (message) => {
          const binEnvPath = await addDirToEnvPath(this.context.paths.home, {
            position: 'start',
            proxyVarName: 'CONFIGU_HOME',
            overwrite: true,
            configSectionName: 'configu',
          });
          debug('addDirToEnvPath', binEnvPath);
          return 'Bin added to PATH';
        },
      },
      {
        enabled: isGlobalOrVersionFlag,
        title: 'Purging cache directory',
        task: async (message) => {
          await fs.rm(this.context.paths.cache, { recursive: true, force: true });
          return 'Cache directory purged';
        },
      },
    ]);

    if (isGlobalOrVersionFlag) {
      const output = [];
      if (this.global) {
        output.unshift('Open a new terminal to apply the changes.');
      }
      output.push(`Run \`configu --help\` to see the available commands.`);
      output.push(`Run \`configu init\` to get started.`);
      prompts.note(output.join('\n'), 'Next steps');
    }

    const outro = [
      `Problems? Open an issue ${color.underline('https://github.com/configu/configu/issues/new/choose')}`,
      `Stuck? Join our Discord ${color.underline('https://discord.com/invite/cjSBxnB9z8')}`,
    ];
    prompts.outro(outro.join('\n'));

    await setTimeout(505);
  }
}
