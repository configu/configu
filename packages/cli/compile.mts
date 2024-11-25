// https://nodejs.org/api/single-executable-applications.html
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */

import { $, tmpdir, which } from 'zx';
import fs from 'node:fs/promises';
import os from 'node:os';
import { path, stdenv } from '@configu/common';

$.quote = (command) => command;

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const rootDir = path.join(scriptDir, '..', '..');

const nodeVersionFile = path.join(rootDir, '.node-version');
const distDir = path.join(scriptDir, 'dist');
const seaConfigFile = path.join(scriptDir, 'sea-config.json');
const binaryName = 'configu';
const outputBinary = stdenv.isWindows ? `${binaryName}.exe` : binaryName;

let signtool = 'signtool';
if (stdenv.provider === 'github_actions') {
  signtool = '%programfiles(x86)%/Windows Kits/10/bin/10.0.17763.0/x86/signtool.exe';
}

(async () => {
  console.log('Starting the build process...');

  // Step 1: Read Node.js version from .node-version file
  const nodeVersion = (await fs.readFile(nodeVersionFile, 'utf-8')).trim();
  console.log(`Node.js version: ${nodeVersion}`);

  // Step 2: Get the distribution to use for compiling from an environment variable
  const nodeArch = process.env.NODE_ARCH || os.arch();
  console.log(`Node.js architecture: ${nodeArch}`);

  const nodeDist = `node-v${nodeVersion}-${stdenv.platform.replace('32', '')}-${nodeArch}`;
  console.log(`Node.js distribution: ${nodeDist}`);

  // Step 3: Create temporary directory
  const tempDir = path.resolve(tmpdir('configu-sea-'));
  console.log(`Temporary directory created at ${tempDir}`);

  // Step 4: Download the Node.js distribution from the official CDN
  const ext = stdenv.isWindows ? 'zip' : 'tar.gz';
  const nodeDistUrl = `https://nodejs.org/dist/v${nodeVersion}/${nodeDist}.${ext}`;
  await $`curl -o ${tempDir}/node.${ext} ${nodeDistUrl}`;
  console.log(`Node.js distribution downloaded from ${nodeDistUrl}`);

  // Step 5: Extract the Node.js distribution
  if (stdenv.isWindows) {
    await $`powershell -command "Expand-Archive -Path '${tempDir}/node.zip' -DestinationPath '${tempDir}' -Force"`;
  } else {
    await $`tar -xzf ${tempDir}/node.tar.gz -C ${tempDir}`;
  }
  console.log(`Node.js distribution extracted to ${tempDir}`);

  // Step 6: Copy the dist directory and sea-config.json file to the temporary directory
  await fs.cp(distDir, path.join(tempDir, 'dist'), { recursive: true });
  await fs.copyFile(seaConfigFile, path.join(tempDir, 'sea-config.json'));
  console.log('dist directory and sea-config.json file copied to the temporary directory');

  // Step 7: Generate the blob to be injected
  const nodeDistDir = path.join(tempDir, nodeDist);
  // ! this step uses the machine installed node and not the downloaded one on purpose
  // ! when gh-actions arm64 is available, this step will be updated to use the downloaded node
  const machineNodePath = await which('node', { nothrow: true });
  const machineNodeVersion = (await $`node --version`).stdout.trim();
  const machinePnpmVersion = (await $`pnpm --version`).stdout.trim();
  const nodeMachine = {
    machineNodePath,
    machineNodeVersion,
    machinePnpmVersion,
    osPlatform: os.platform(),
    osArch: os.arch(),
    stdenvNodeVersion: stdenv.nodeVersion,
  };
  console.log(nodeMachine);

  await $`cd ${tempDir} && pnpx tsx --experimental-sea-config sea-config.json`;
  console.log('Blob generated for single executable application');

  // Step 8: Create a copy of the Node.js executable
  const nodePath = stdenv.isWindows ? path.join(nodeDistDir, 'node.exe') : path.join(nodeDistDir, 'bin', 'node');
  const outputPath = path.join(tempDir, outputBinary);
  await fs.copyFile(nodePath, outputPath);
  console.log(`Node.js executable copied to ${outputPath}`);

  const files = await fs.readdir(tempDir);
  console.log(files);

  // Step 9: Remove the signature of the binary (if applicable)
  if (stdenv.isMacOS) {
    await $`codesign --remove-signature ${outputPath}`;
    console.log('Signature removed from the binary (macOS)');
  } else if (stdenv.isWindows) {
    // Optional: Remove signature using signtool if available
    await $`${signtool} remove /s ${outputPath}`;
  }

  // Step 10: Inject the blob into the copied binary using postject
  let postjectCommand = `pnpx postject ${outputPath} NODE_SEA_BLOB ${path.join(tempDir, 'sea-prep.blob')} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
  if (stdenv.isMacOS) {
    postjectCommand += ' --macho-segment-name NODE_SEA';
  }
  await $`${postjectCommand}`;
  console.log('Blob injected into the binary using postject');

  // Step 11: Optionally, sign the binary (if applicable)
  if (stdenv.isMacOS) {
    await $`codesign --sign - ${outputPath}`;
    console.log('Binary signed (macOS)');
  } else if (stdenv.isWindows) {
    // Optional: Sign the binary using signtool if available
    await $`${signtool} sign /fd SHA256 ${outputPath}`;
  }

  // Step 12: Copy the executable to the working directory's dist directory
  const finalOutputPath = path.join(distDir, outputBinary);
  await fs.copyFile(outputPath, finalOutputPath);
  console.log(`Executable copied to ${finalOutputPath}`);

  // Step 13: Clean up temporary directory
  await fs.rm(tempDir, { recursive: true, force: true });
  console.log('Temporary directory cleaned up');

  // // Step 14: Run the binary to verify it works
  // const quoteEscaping = $.quote;
  // $.quote = (command) => command;
  // await $`${finalOutputPath} -v`;
  // $.quote = quoteEscaping;
  // console.log('Executable verified successfully');

  console.log('Build process completed successfully');
})();
