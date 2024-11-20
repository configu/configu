import { arch, platform } from 'node:os';
import { compress } from './gz';
import { downloadNode } from './node-downloader';

const os = platform() as 'win' | 'linux' | 'darwin';
const osArch = arch();

console.log('Platform:', os);

async function compile(selectedArch: 'arm64' | 'x64') {
  // eslint-disable-next-line no-useless-concat
  const { run } = await import('./' + `${os}.ts`);

  const fileName = `configu-${os}-${selectedArch}`;
  const filePath = await run(
    fileName,
    selectedArch === osArch ? process.execPath : await downloadNode(os === 'win32' ? 'win' : os, selectedArch),
  );

  console.log('app compiled:', filePath);

  return filePath;
}

compile((process.env.SELECTED_ARCH || osArch) as 'arm64' | 'x64').then((file) => compress(file));
