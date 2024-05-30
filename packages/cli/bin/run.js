#!/usr/bin/env node

(async () => {
  const oclif = await import('@oclif/core');
  await oclif.execute({ development: false, dir: __dirname });
})();
