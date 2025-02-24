import { Option } from 'clipanion';
import * as t from 'typanion';
import process from 'node:process';
import Fs from 'node:fs';
import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import stream from 'node:stream/promises';
import { addDirToEnvPath } from '@pnpm/os.env.path-extender';
import * as tar from 'tar';
import Zip from 'adm-zip';
import * as prompts from '@clack/prompts';
import { debug, path, stdenv, semver, color, configuFilesApi, pathExists, glob } from '@configu/common';
import { BaseCommand } from './base';

export class InstallCommand extends BaseCommand {
  static override paths = [['install']];
  // hide the command from the help menu
  static override usage = undefined;

  version = Option.String('--version,-v', {
    description: `Install a specific version of the binary globally on the system`,
    env: 'CONFIGU_VERSION',
  });

  async execute() {
    const output = [];
    prompts.intro(`Configu Installer`);
    const spinner = prompts.spinner();
    spinner.start(`Installing ${this.cli.binaryName}`);

    try {
      await this.init();
      if (!this.context.isExecutable || !this.context.isExecFromHome) {
        throw new Error(`${this.constructor.name} is only supported running as an executable from the home directory`);
      }

      spinner.message(`Resolving version`);
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
      version = version.replace('v', '');
      if (!semver.valid(version)) {
        throw new Error(`Invalid version ${version}`);
      }
      spinner.message(`Installing ${version} version`);

      const binDir = path.join(this.context.paths.bin, version);
      const nextExecPath = path.join(binDir, this.cli.binaryName, this.context.execExt);

      const isExecExists = await pathExists(nextExecPath);
      if (isExecExists) {
        spinner.message(`Version exists locally`);
      } else {
        spinner.message(`Downloading ${version} version`);
        const hostDist = `${process.platform.replace('32', '')}-${process.arch}`;
        const archiveExt = !stdenv.isWindows ? '.tar.gz' : '.zip';

        const remoteArchive = await configuFilesApi({
          method: 'GET',
          url: `/cli/versions/${version}/${this.cli.binaryName}-v${version}-${hostDist}${archiveExt}`,
          responseType: 'stream',
        });

        await fs.mkdir(binDir, { recursive: true });
        const archivePath = path.join(binDir, `${this.cli.binaryName}${archiveExt}`);
        const localArchive = Fs.createWriteStream(archivePath);
        remoteArchive.data.pipe(localArchive);
        await stream.finished(localArchive);

        const files = await fs.readdir(binDir);
        debug('binDir', files);

        if (archiveExt === '.tar.gz') {
          await tar.x({ file: archivePath, gzip: true, cwd: binDir });
        } else {
          const zip = new Zip(archivePath);
          zip.extractAllTo(binDir, true);
        }
        spinner.message(`Version ${version} downloaded`);
      }

      // https://github.com/pnpm/pnpm/blob/main/packages/plugin-commands-setup/src/setup.ts#L67
      spinner.message(`Creating ${this.cli.binaryName} shims`);
      // windows can also use shell script via mingw or cygwin so no filter
      const shellScript = ['#!/bin/sh', `exec ${nextExecPath} "$@"`].join('\n');
      await fs.writeFile(path.join(this.context.paths.home, this.cli.binaryName), shellScript, { mode: 0o755 });
      if (stdenv.isWindows) {
        const batchScript = ['@echo off', `${nextExecPath} %*`].join('\n');
        await fs.writeFile(path.join(this.context.paths.home, `${this.cli.binaryName}.cmd`), batchScript, {
          mode: 0o755,
        });
        const powershellScript = `${nextExecPath} $args`;
        await fs.writeFile(path.join(this.context.paths.home, `${this.cli.binaryName}.ps1`), powershellScript, {
          mode: 0o755,
        });
      }
      spinner.message(`shims created`);

      // https://bit.cloud/pnpm/os/env/path-extender
      spinner.message(`Adding ${this.cli.binaryName} to PATH`);
      const binEnvPath = await addDirToEnvPath(this.context.paths.home, {
        position: 'start',
        proxyVarName: 'CONFIGU_HOME',
        overwrite: true,
        configSectionName: this.cli.binaryName,
      });
      debug('addDirToEnvPath', binEnvPath);
      if (binEnvPath.configFile?.changeType !== 'skipped') {
        output.push(`Open a new terminal to apply the changes.`);
      }
      spinner.message(`${this.cli.binaryName} added to PATH`);

      spinner.stop(`${this.cli.binaryName} installed`, 0);
      output.push(`Run \`${this.cli.binaryName} --help\` to see the available commands.`);
      // output.push(`Run \`${this.cli.binaryName} init\` to get started.`);
      prompts.note(output.join('\n'), 'Next steps');

      const outro = [
        `Problems? Open an issue ${color.underline('https://github.com/configu/configu/issues/new/choose')}`,
        `Stuck?    Join our Discord ${color.underline('https://discord.com/invite/cjSBxnB9z8')}`,
      ];
      prompts.outro(outro.join('\n   '));
      await setTimeout(505);
    } catch (error) {
      spinner.stop(`${this.cli.binaryName} failed to install`, 1);
      throw error;
    }
  }
}
