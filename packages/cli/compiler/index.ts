import { platform } from 'node:os';
import { compress } from './gz';

const os = platform();

console.log('Platform:', os);

async function compile() {
  // eslint-disable-next-line no-useless-concat
  const { run } = await import('./' + `${os}.ts`);

  const fileName = `configu-${os}`;
  const filePath = await run(fileName);

  console.log('app compiled:', filePath);

  return filePath;
}

compile().then(compress);
