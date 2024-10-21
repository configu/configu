import { platform } from 'node:os';
import { join } from 'node:path';

const os = platform();

console.log('Platform:', os);

async function compile() {
  const { run } = await import(join(import.meta.dirname, `${os}.ts`));

  run();
}

compile();
