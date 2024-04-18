const fs = require('fs/promises');
const path = require('path');

const downloadFile = async (url, targetFile) =>
  await new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const code = response.statusCode ?? 0;

        if (code >= 400) {
          return reject(new Error(response.statusMessage));
        }

        // handle redirects
        if (code > 300 && code < 400 && !!response.headers.location) {
          return resolve(downloadFile(response.headers.location, targetFile));
        }

        // save the file to disk
        const fileWriter = fs.createWriteStream(targetFile).on('finish', () => {
          resolve({});
        });

        response.pipe(fileWriter);
      })
      .on('error', (error) => {
        reject(error);
      });
  });


const prepareReadme = async ({ source, target, slug, title }) => {
  source = `https://raw.githubusercontent.com/configu/configu/main/${source}`;
  target = path.join(__dirname, target);

  await downloadFile(source, target);

  let content = await fs.readFile(target, { encoding: 'utf8' });

  content = content.replace(/# @configu.*\n\n/, '');
  content = content.replace(/<!--.*\n/, '');

  content = `---
slug: ${slug}
title: ${title}
---

${content}
`;

  await fs.writeFile(target, content, { flag: 'w' });
};

const source = 'https://oss.configu.com/cli/manifest.md';
const target = path.join(__dirname, './cli-commands.mdx');

const prepareCliRef = async () => {
  await downloadFile(source, target);

  let content = await fs.readFile(target, { encoding: 'utf8' });

  content = content.replace('<!-- commands -->\n', '');
  content = content.replace('<!-- commandsstop -->\n', '');

  content = content.replace(/## `(.*)`/g, '## $1');

  content = content.replace(/\nUSAGE/g, 'bash\nUSAGE');
  content = content.replace(/\n_.*_\n/g, '');

  content = `---
slug: cli-commands
title: CLI Command Reference
---

This section contains reference documentation for working with the Configu CLI. For a step-by-step introduction, you can get started with [this guide](/get-started).

${content}
`;

  await fs.writeFile(target, content, { flag: 'w' });
};

const prepare = async () => {
  await prepareReadme({
    source: 'ts/packages/cli/README.md',
    target: 'CLI/cli-overview.mdx',
    slug: 'cli-overview',
    title: 'Configu CLI',
  });
  await prepareCliRef();
  await prepareReadme({
    source: 'ts/packages/node/README.md',
    target: 'SDK/nodejs-sdk.mdx',
    slug: 'nodejs-sdk',
    title: 'Node.js SDK',
  });
  await prepareReadme({
    source: 'py/README.md',
    target: 'SDK/python-sdk.mdx',
    slug: 'python-sdk',
    title: 'Python SDK',
  });
  await prepareReadme({
    source: 'ts/packages/browser/README.md',
    target: 'SDK/browser-sdk.mdx',
    slug: 'browser-sdk',
    title: 'Browser SDK',
  });
};
