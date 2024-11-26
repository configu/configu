const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const ext = 'js';
const dist = `${os.platform}-${os.arch}`;

let version = process.env.CONFIGU_VERSION ?? 'latest';
if (!['latest', 'next'].includes(version) && !version.startsWith('v')) {
  version = `v${version}`;
}

const dir = process.env.CONFIGU_PATH ?? path.join(os.homedir(), '.configu');
const bin = path.join(dir, 'bin');
const exe = path.join(bin, `configu.${ext}`);

// todo: add configu-${dist}.js to the release assets
const download = `https://github.com/configu/configu/releases/download/cli/${version}/${dist}.js`;

(async () => {
  try {
    await fs.mkdir(bin, { recursive: true });

    console.log(`Downloading configu from ${download}`);
    const res = await fetch(download);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${download}: ${res.status} ${res.statusText}`);
    }
    await fs.writeFile(exe, await res.text());
    console.log(`Configu was downloaded successfully to ${exe}`);
    console.log(`Run 'node ${exe} --help' to get started`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
})();
