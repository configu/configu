import { platform } from 'node:os';

const os = platform();

console.log('Platform:', os);

async function compile() {
  // eslint-disable-next-line no-useless-concat
  const { run } = await import('./' + `${os}.ts`);

  run(`configu-${os}`);
}

compile();
