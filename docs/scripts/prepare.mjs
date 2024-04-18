#!/usr/bin/env npx zx

import { PAGE_EXT, ROOT_PATH, DOCS_ROOT_PATH, MINT_PATH, _, confirm } from './utils.mjs';

// Write the integrations index.json data to the snippets/index.mdx file as a variable
const INTEGRATIONS_INDEX_PATH = path.join(DOCS_ROOT_PATH, 'integrations', 'index.json');
const INTEGRATIONS_INDEX_CONTENT = await fs.readJson(INTEGRATIONS_INDEX_PATH);

const INTEGRATIONS_MDX_PATH = path.join(DOCS_ROOT_PATH, 'snippets', 'index.mdx');
const INTEGRATIONS_INDEX_MDX_CONTENT = `export const integrations = ${JSON.stringify(INTEGRATIONS_INDEX_CONTENT, null, 2)};`

await fs.writeFile(INTEGRATIONS_MDX_PATH, INTEGRATIONS_INDEX_MDX_CONTENT, { flag: 'w' });

// Build a navigation array for the mint.json based on the index.json integration data. Use the group prop of each to determine the navigation structure and the docs as the page link.
const integrationsNavArray = _(INTEGRATIONS_INDEX_CONTENT)
  .values()
  .reduce((acc, cur) => {
    const [group, subgroup] = cur.group;

    // Initialize the group if it doesn't exist
    if (!acc.some(item => item.group === group)) {
      acc.push({ group, pages: [] });
    }

    // If there is no subgroup, push the docs to the group
    if (!subgroup) {
      acc.find(item => item.group === group).pages.push(cur.docs, ...(cur.pages ?? []));
      return acc;
    }

    // Initialize the subgroup if it doesn't exist
    if (!acc.find(item => item.group === group).pages.some(item => item.group === subgroup)) {
      acc.find(item => item.group === group).pages.push({ group: subgroup, pages: [] });
    }

    // Push the current integration docs to the correct subgroup
    acc.find(item => item.group === group).pages.find(item => item.group === subgroup).pages.push(cur.docs, ...(cur.pages ?? []));

    return acc;
  }, []);


// Update the mint.json file with the new integrations navigation data
const MINT_CONTENT = await fs.readJson(MINT_PATH);

const INTEGRATIONS_NAV = MINT_CONTENT.navigation.find(item => item.group === 'Integrations');
INTEGRATIONS_NAV.pages = ["integrations/overview", ...integrationsNavArray];

await fs.writeJson(path.join(DOCS_ROOT_PATH, 'mint.json'), MINT_CONTENT, { spaces: 2});

const prepareReadme = async ({ source, target, title = 'Overview' }) => {
  const sourcePath = path.join(ROOT_PATH, source);
  const targetPath = path.join(DOCS_ROOT_PATH, target);

  let content = await fs.readFile(sourcePath, { encoding: 'utf8' });

  // Remove the @configu title
  content = content.replace(/# @configu.*\n\n/, '');
  // Extract the first paragraph as the page description and remove it also from the content
  const description = content.match(/.*\n/)[0];
  content = content.replace(/.*\n/, '');
  // Remove any HTML comments
  content = content.replace(/<!--.*\n/, '');

  content = `---
title: ${title}
description: ${description}
---

${content}
`;

  // await fs.writeFile(targetPath, content, { flag: 'w' });
  console.log(content);
};


await prepareReadme({
  source: 'ts/packages/cli/README.md',
  target: 'interfaces/cli/overview.mdx',
});

// Check the navigation structure for missing pages
const missingPages = [];
const checkNavigation = async (navigation) => {
  for (const item of navigation) {
    if (typeof item === 'object') {
      await checkNavigation(item.pages);
    } else {
      const pagePath = path.join(DOCS_ROOT_PATH, `${item}${PAGE_EXT}`);
      const exists = await fs.pathExists(pagePath);
      if (!exists) {
        const baseName = path.basename(pagePath, PAGE_EXT);
        echo(`Missing page: ${baseName}`);
        missingPages.push(pagePath);
      }
    }
  }
};

await checkNavigation(MINT_CONTENT.navigation);

for (const page of missingPages) {
  const answer = await confirm(`The page "${page}" is missing.\nWould you like to create it? `);
  if (answer) {
    // Create the missing page nested in the correct directory structure
    const pageDir = path.dirname(page);
    console.log(pageDir);
    await fs.mkdir(pageDir, { recursive: true });
    await fs.writeFile(page, `---
// TODO: Add content to this page
---

import { Construction } from '/snippets/callouts.mdx'

<Construction />`);
  }
}
