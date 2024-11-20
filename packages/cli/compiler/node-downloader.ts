import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { downloadFile } from './download-file';

export async function downloadNode(os: 'win' | 'linux' | 'darwin', arch: 'arm64' | 'x64'): Promise<string> {
  const ext = os === 'win' ? 'zip' : 'tar.gz';
  const url = `https://nodejs.org/download/release/${process.version}/node-${process.version}-${os}-${arch}.${ext}`;
  console.log(`Downloading node for ${os} ${arch}`, url);

  // download node from url
  const nodePath = `./node-${process.version}-${os}-${arch}.${ext}`;
  await downloadFile(url, nodePath);
  console.log(`Downloaded node to ${nodePath}`);

  // extract node using native tools via execSync
  const extractDirParent = path.join(process.cwd(), 'dist');
  const extractDir = path.join(extractDirParent, `node-${process.version}-${os}-${arch}`);

  // Create extraction directory if it doesn't exist
  await fs.promises.mkdir(extractDir, { recursive: true });

  if (os === 'win') {
    execSync(`powershell -command "Expand-Archive -Path '${nodePath}' -DestinationPath '${extractDirParent}' -Force"`, {
      stdio: 'inherit',
    });
  } else {
    execSync(`tar -xzf "${nodePath}" -C "${extractDir}" --strip-components 1`, {
      stdio: 'inherit',
    });
  }

  // cleanup downloaded archive
  await fs.promises.unlink(nodePath);

  console.log('node extracted to:');
  console.log(extractDir);
  console.log(fs.readdirSync(extractDir));

  // return path to extracted node directory
  return path.join(extractDir, os === 'win' ? 'node.exe' : 'bin/node');
}
