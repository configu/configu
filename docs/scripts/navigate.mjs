#!/usr/bin/env npx zx

import 'zx/globals'
import { constantCase, sentenceCase } from 'change-case'

const PAGE_EXT = '.mdx';
const rootPath = await path.join(__dirname, '..');
const mintPath = await path.join(rootPath, 'mint.json');

const mintContent = await fs.readJson(mintPath);
const { navigation } = mintContent;

const missingPage = [];

const checkNavigation = async (nav) => {
  for (const item of nav) {
    if (typeof item === 'object') {
      await checkNavigation(item.pages);
    } else {
      const pagePath = path.join(rootPath, `${item}${PAGE_EXT}`);
      const exists = await fs.pathExists(pagePath);
      if (!exists) {
        const baseName = path.basename(pagePath, PAGE_EXT);
        echo(`Missing page: ${sentenceCase(baseName)}`);
        missingPage.push(pagePath);
      }
    }
  }
};

await spinner('working...', () => checkNavigation(navigation))

if (missingPage.length > 0) {
  const bear = await question('What kind of bear is best? ');
  console.log(bear);
}


// const x = await $`pwd`
// echo(x, __dirname)
// echo`${version}`

// await $`cat package.json | grep name`

// const branch = await $`git branch --show-current`
// await $`dep deploy --branch=${branch}`

// await Promise.all([
//   $`sleep 1; echo 1`,
//   $`sleep 2; echo 2`,
//   $`sleep 3; echo 3`,
// ])

// const name = 'foo bar'
// await $`mkdir /tmp/${name}`
