/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */

import 'zx/globals';
import _ from 'lodash';
import TypeDoc from 'typedoc';
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';
import TypeDocConfig from './typedoc.js';

const ROOT_PATH = path.join(__dirname, '..');
const DOCS_ROOT_PATH = __dirname;
const MINT_PATH = path.join(DOCS_ROOT_PATH, 'mint.json');
const MINT_CONTENT = await fs.readJson(MINT_PATH);

// --- integrations ---
// Write the integrations index.json data to the snippets/index.mdx file as a variable
const INTEGRATIONS_INDEX_PATH = path.join(DOCS_ROOT_PATH, 'integrations', 'index.json');
const INTEGRATIONS_INDEX_CONTENT = await fs.readJson(INTEGRATIONS_INDEX_PATH);

const INTEGRATIONS_MDX_PATH = path.join(DOCS_ROOT_PATH, 'snippets', 'index.mdx');
const INTEGRATIONS_INDEX_MDX_CONTENT = `export const integrations = ${JSON.stringify(INTEGRATIONS_INDEX_CONTENT, null, 2)};`;

await fs.writeFile(INTEGRATIONS_MDX_PATH, INTEGRATIONS_INDEX_MDX_CONTENT, { flag: 'w' });

// Build a navigation array for the mint.json based on the index.json integration data. Use the group prop of each to determine the navigation structure and the docs as the page link.
const integrationsNavArray = _(INTEGRATIONS_INDEX_CONTENT)
  .values()
  .reduce((acc, cur) => {
    const { enabled, docs, pages = [] } = cur;
    const [group, subgroup] = cur.group;

    if (!enabled) {
      return acc;
    }

    // Initialize the group if it doesn't exist
    if (!acc.some((item) => item.group === group)) {
      acc.push({ group, pages: [] });
    }

    // If there is no subgroup, push the docs to the group
    if (!subgroup) {
      acc.find((item) => item.group === group).pages.push(docs, ...pages);
      return acc;
    }

    // Initialize the subgroup if it doesn't exist
    if (!acc.find((item) => item.group === group).pages.some((item) => item.group === subgroup)) {
      acc.find((item) => item.group === group).pages.push({ group: subgroup, pages: [] });
    }

    // Push the current integration docs to the correct subgroup
    acc
      .find((item) => item.group === group)
      .pages.find((item) => item.group === subgroup)
      .pages.push(docs, ...pages);

    return acc;
  }, []);

const INTEGRATIONS_NAV = MINT_CONTENT.navigation.find((item) => item.group === 'Integrations');
INTEGRATIONS_NAV.pages = ['integrations/overview', ...integrationsNavArray];

// --- interfaces ---
const INTERFACES_TITLE = {
  [TypeDocConfig.name]: 'Overview',
  '@configu/ts': 'TypeScript SDK',
  '@configu/node': 'Node.js SDK',
  '@configu/browser': 'Browser SDK',
  '@configu/lib': 'Common Library',
  '@configu/cli': 'Overview',
};
const README_FILE = `${TypeDocConfig.entryFileName}${TypeDocConfig.fileExtension}`;
const REF_FILE = `globals${TypeDocConfig.fileExtension}`;

// Process README files to create the MDX files for the docs
const prepareREADME = async ({ source, target, title = 'Overview' }) => {
  const sourcePath = path.join(ROOT_PATH, source);
  const targetPath = path.join(ROOT_PATH, target);

  let contents = await fs.readFile(sourcePath, { encoding: 'utf8' });

  // Remove the @configu title
  contents = contents.replace(/# @configu.*\n\n/, '');
  // Extract the first paragraph as the page description and remove it also from the content
  const description = contents.match(/.*\n/)[0].replace('\n', '');
  contents = contents.replace(/.*\n/, '');
  // Remove any HTML comments
  contents = contents.replace(/<!--[\s\S]*?(?:-->)/g, '');
  // Replace any absolute docs link to relative link
  contents = contents.replace(/https:\/\/docs\.configu\.com/g, '');
  // Remove .mdx extension from links
  contents = contents.replace(/\.mdx/g, '');

  contents = `---
title: '${title}'
description: '${description}'
---
${contents}
`;

  await fs.writeFile(targetPath, contents, { flag: 'w' });
};

const sdkNavPages = [];

const app = await TypeDoc.Application.bootstrapWithPlugins();
const project = await app.convert();
app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
  if (page.filename.endsWith(REF_FILE)) {
    page.frontmatter = {
      title: `${page.model?.name} Reference`,
      ...page.frontmatter,
    };
  }
});
app.renderer.on(MarkdownPageEvent.END, (page) => {
  // Remove .mdx extension from links
  page.contents = page.contents?.replace(/\.mdx/g, '');
  // Remove any HTML comments - https://gist.github.com/cvan/93376f56e5dd5a2bbbcf152490de7d66
  page.contents = page.contents?.replace(/<!--[\s\S]*?(?:-->)/g, '');
});
app.renderer.postRenderAsyncJobs.push(async (renderer) => {
  const { navigation, urls } = renderer;
  Promise.all([
    urls.map(({ url, model }) => {
      if (url.endsWith(README_FILE)) {
        console.log(model.name);
        sdkNavPages.push(`${TypeDocConfig.out}/${url.replace(TypeDocConfig.fileExtension, '')}`);
        return prepareREADME({
          source: `docs/${TypeDocConfig.out}/${url}`,
          target: `docs/${TypeDocConfig.out}/${url}`,
          title: INTERFACES_TITLE[model.name],
        });
      }
      return Promise.resolve();
    }),
  ]);
});
await app.generateDocs(project, TypeDocConfig.out);

const INTERFACES_SDK_NAV = MINT_CONTENT.navigation
  .find((item) => item.group === 'Interfaces')
  .pages.find((item) => item.group === TypeDocConfig.name);
INTERFACES_SDK_NAV.pages = sdkNavPages;

// Process `oclif readme` output file to create the MDX file for the docs
const CLI_PKG = '@configu/cli';

await prepareREADME({
  source: 'packages/cli/README.md',
  target: 'docs/interfaces/cli/overview.mdx',
  title: INTERFACES_TITLE[CLI_PKG],
});

const REF_PATH = path.join(ROOT_PATH, 'docs/interfaces/cli', 'ref.mdx');
process.env.REF_PATH = REF_PATH;
await $`pnpm --filter ${CLI_PKG} build:ref`.pipe(process.stdout);
await sleep(1000);

let contents = await fs.readFile(REF_PATH, { encoding: 'utf8' });
contents = `---
title: 'Command Reference'
sidebarTitle: 'Reference'
description: 'A reference guide for all Configu CLI commands.'
---

import { Related } from '/snippets/callouts.mdx';

<Related name="Hello, World!" link="/guides/hello-world" />

## Commands

<Tip>
  Use \`configu -h\` or to get a list of all available commands.<br/>
  Use \`configu [COMMAND] -h\` to get help for a specific command.
</Tip>

${contents}
`;
await fs.writeFile(REF_PATH, contents, { flag: 'w' });

// --- general ---
await fs.writeJson(path.join(DOCS_ROOT_PATH, 'mint.json'), MINT_CONTENT, { spaces: 2 });

// Check for broken links in the docs
await $`pnpm mintlify broken-links`.pipe(process.stdout);
await $`pnpm prettier --ignore-path .gitignore --write .`.pipe(process.stdout);
