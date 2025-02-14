/* eslint-disable import/no-extraneous-dependencies */

// https://nodejs.org/api/single-executable-applications.html

import process from 'node:process';
import fs from 'node:fs/promises';
import { $, which, cd } from 'zx';
import { path, stdenv } from '@configu/common';

// input: NODE_VERSION, NODE_DIST
// output: dist/configu, dist/configu-v$NODE_VERSION-$NODE_DIST.{tar.gz,zip}

$.quote = (command) => command;

const scriptDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const distDir = path.join(scriptDir, 'dist');
const rootDir = path.join(scriptDir, '..', '..');
const nodeVersionFile = path.join(rootDir, '.node-version');

const archiveExt = !stdenv.isWindows ? 'tar.gz' : 'zip';
const binaryName = 'configu';
const configuBinary = stdenv.isWindows ? `${binaryName}.exe` : binaryName;
const configuJs = `${binaryName}.cjs`;

const supportedDist = [
  'linux-arm64', // https://nodejs.org/
  'linux-armv7l',
  'linux-ppc64le',
  'linux-s390x',
  'linux-x64',
  'linux-x64-musl', // https://unofficial-builds.nodejs.org/
  'darwin-arm64',
  'darwin-x64',
  'win-arm64',
  'win-x64',
] as const;

type NodeDist = (typeof supportedDist)[number];

// todo: complete signtoll on windows builds
let signtool = 'signtool';
if (stdenv.provider === 'github_actions') {
  signtool = '%programfiles(x86)%/Windows Kits/10/bin/10.0.17763.0/x86/signtool.exe';
}

(async () => {
  console.log('Starting the build process...');

  // build the cli typescript code
  cd(scriptDir);
  await $`pnpm clean && pnpm build`.pipe(process.stdout);

  // get node information
  const hostNode = {
    which: await which('node', { nothrow: true }),
    versions: {
      node: (await $`node --version`).stdout.trim(),
      pnpm: (await $`pnpm --version`).stdout.trim(),
      tsx: (await $`tsx --version`).stdout.trim(),
    },
    exe: 'pnpx tsx',
    version: process.version.replace('v', ''),
    dist: `${process.platform.replace('32', '')}-${process.arch}`,
  };

  const configuNode = {
    exe: 'node',
    version: (await fs.readFile(nodeVersionFile, 'utf-8')).trim(),
    dist: hostNode.dist,
  };

  const targetNode = {
    build: '',
    exe: '',
    version: process.env.NODE_VERSION ?? hostNode.version,
    dist: process.env.NODE_DIST ?? hostNode.dist,
  };
  targetNode.version = targetNode.version.replace('v', '');
  if (configuNode.version !== targetNode.version) {
    throw new Error(`Mismatched Node.js versions: ${configuNode.version} !== ${targetNode.version}`);
  }
  if (!supportedDist.includes(targetNode.dist as NodeDist)) {
    throw new Error(`Unsupported platform/architecture: ${targetNode.dist}`);
  }
  targetNode.build = `node-v${targetNode.version}-${targetNode.dist}`;
  targetNode.exe = !stdenv.isWindows
    ? path.join(distDir, targetNode.build, 'bin', 'node')
    : path.join(distDir, targetNode.build, 'node.exe');

  console.log('Node.js information:');
  console.log('Host:', hostNode);
  console.log('Configu:', configuNode);
  console.log('Target:', targetNode);

  // download the node distribution from node cdn to use for compiling
  let nodeDistHost = 'https://nodejs.org';
  if (targetNode.dist === 'linux-x64-musl') {
    nodeDistHost = 'https://unofficial-builds.nodejs.org';
  }
  const nodeDistUrl = `${nodeDistHost}/download/release/v${targetNode.version}/${targetNode.build}.${archiveExt}`;
  const nodeArchive = path.join(distDir, `${targetNode.build}.${archiveExt}`);
  await $`curl -o ${nodeArchive} ${nodeDistUrl}`.pipe(process.stdout);
  console.log(`Node.js distribution downloaded from ${nodeDistUrl}`);

  // extract the node distribution
  if (stdenv.isWindows) {
    await $`powershell -command "Expand-Archive -Path '${nodeArchive}' -DestinationPath '${distDir}'"`;
  } else {
    await $`tar -xzf ${nodeArchive} -C ${distDir}`;
  }
  console.log(`Node.js distribution extracted to ${path.join(distDir, targetNode.build)}`);

  // generate the blob to be injected
  // ! this step uses the machine host installed node (tsx) and not the downloaded one on purpose
  // ! when gh-actions arm64 is available, this step will be updated to use the downloaded node
  cd(scriptDir);
  await $`${hostNode.exe} --experimental-sea-config sea-config.json`.pipe(process.stdout);
  console.log('Blob generated for single executable application');

  // create a copy of the Node.js executable
  cd(distDir);
  await fs.cp(targetNode.exe, configuBinary);
  console.log(`Node.js executable copied to ${configuBinary}`);

  // remove the signature of the binary (if applicable)
  if (stdenv.isMacOS) {
    await $`codesign --remove-signature ${configuBinary}`.pipe(process.stdout);
    console.log('Signature removed from the binary (macOS)');
  } else if (stdenv.isWindows) {
    // Optional: Remove signature using signtool if available
    // await $`${signtool} remove /s ${outputPath}`.pipe(process.stdout);
  }

  // inject the blob into the copied binary using postject
  let postjectCommand = `pnpx postject ${configuBinary} NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
  if (stdenv.isMacOS) {
    postjectCommand += ' --macho-segment-name NODE_SEA';
  }
  await $`${postjectCommand}`.pipe(process.stdout);
  console.log('Blob injected into the binary using postject');

  // optionally, sign the binary (if applicable)
  if (stdenv.isMacOS) {
    await $`codesign --sign - ${configuBinary}`.pipe(process.stdout);
    console.log('Binary signed (macOS)');
  } else if (stdenv.isWindows) {
    // Optional: Sign the binary using signtool if available
    // await $`${signtool} sign /fd SHA256 ${outputPath}`.pipe(process.stdout);
  }

  // compress the executable
  const { version } = await fs.readFile(path.join(scriptDir, 'package.json'), 'utf-8').then((data) => JSON.parse(data));
  const configuArchive = `${binaryName}-v${version}-${targetNode.dist}.${archiveExt}`;
  if (stdenv.isWindows) {
    await $`powershell -command "Compress-Archive -Path '${configuBinary}', '${configuJs}' -DestinationPath '${configuArchive}'"`;
  } else {
    await $`tar -czf ${configuArchive} -C ${distDir} ${configuBinary} ${configuJs}`.pipe(process.stdout);
  }
  console.log(`Executable compressed to ${path.join(distDir, configuArchive)}`);

  // run the binary to verify it works
  if (!stdenv.isCI) {
    await $`${configuBinary} -v`.pipe(process.stdout);
    console.log('Executable verified successfully');
  }

  console.log('Build process completed successfully');
})();
