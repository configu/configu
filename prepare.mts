/* eslint-disable no-restricted-syntax */
import { $, cd, chalk, fs, glob } from 'zx';
import packageJson from './package.json' with { type: 'json' };

const ROOT_PATH = import.meta.dirname;

const getCurrentNodeLTSVersion = async () => {
  const resp = await fetch('https://nodejs.org/dist/index.json');
  const data = await resp.json();
  const lts = data.filter((v: { lts: string }) => v.lts)[0];
  const version = lts.version.replace('v', '');
  return version as string;
};

(async () => {
  cd(ROOT_PATH);

  const node = {
    engine: packageJson.config.node,
    lts: await getCurrentNodeLTSVersion(),
    current: process.versions.node,
  };
  const pnpm = {
    engine: packageJson.config.pnpm,
    // lts: 'pnpm has its own version management',
    current: (await $`pnpm --version`).stdout.trim(),
  };

  if (node.lts !== node.engine) {
    console.warn(`Node.js Update available! ${chalk.red(node.engine)} → ${chalk.green(node.lts)}.
${chalk.magenta('Changelog:')} https://nodejs.org/en/blog/release/v${node.lts}
Run "${chalk.magenta(`pnpm exec npm pkg set config.node=${node.lts}`)}" to update.`);
  }

  await fs.writeFile('.nvmrc', `${node.engine}\n`);
  await fs.writeFile('.node-version', `${node.engine}\n`);

  let pnpmWorkspace = await fs.readFile('pnpm-workspace.yaml', 'utf-8');
  pnpmWorkspace = pnpmWorkspace.replace(/useNodeVersion:\s*(.*)/, `useNodeVersion: ${node.engine}`);
  await fs.writeFile('pnpm-workspace.yaml', pnpmWorkspace);

  const dockerFiles = await glob('**/Dockerfile', { dot: true, gitignore: true });
  for await (const file of dockerFiles) {
    let content = await fs.readFile(file, 'utf-8');
    content = content.replace(/NODE_VERSION="(.*)"/, `NODE_VERSION="${node.engine}"`);
    await fs.writeFile(file, content);
  }

  await $`pnpm exec npm pkg set packageManager=pnpm@${pnpm.engine}`.pipe(process.stdout);
  // await $`pnpm exec npm pkg set devEngines.packageManager.version=${pnpm.engine}`.pipe(process.stdout);

  await $`pnpm --filter @configu/common exec npm pkg set engines.node=${node.engine}`.pipe(process.stdout);
  await $`pnpm exec npm pkg set devEngines.runtime.version=${node.engine}`.pipe(process.stdout);

  let exitCode = 0;
  if (node.current !== node.engine) {
    console.error(`This project requires Node.js ${node.engine} but you are running ${node.current}.
    Please switch to the correct version using a Node.js version manager
    https://nodejs.org/en/download`);
    exitCode = 1;
  }

  if (pnpm.current !== pnpm.engine) {
    console.error(`This project requires pnpm ${pnpm.engine} but you are running ${pnpm.current}.
    Run "${chalk.magenta(`corepack enable`)}" to switch to the correct version.`);
    exitCode = 1;
  }

  process.exitCode = exitCode;
})();
