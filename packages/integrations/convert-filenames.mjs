import { rename, readdir } from 'node:fs/promises';

async function start() {
  const path = './dist/latest';

  const list = await readdir(path);

  await Promise.all(
    list.map(async (file) => {
      if (!file.includes('.os-')) {
        return;
      }
      const oldName = `${path}/${file}`;
      const newName = `${path}/${file.replace('.os-', '-')}`;
      await rename(oldName, newName);
    }),
  );
}

start();
