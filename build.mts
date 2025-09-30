import { build } from 'esbuild';
import { $, fs, path } from 'zx';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const packageName = process.env.npm_package_name || 'unknown';
console.log(`Building ${packageName}...`);

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ],
  treeShaking: true,
  splitting: false,
  keepNames: true,
  sourcemap: true,
  metafile: true,
  outdir: 'dist',
};

await Promise.all([
  build({
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    ...sharedConfig,
  }),
  build({
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    ...sharedConfig,
  }),
]);

await $`tsc`.pipe(process.stdout);

const extractorConfig = ExtractorConfig.prepare({
  configObjectFullPath: path.join(process.cwd(), 'api-extractor.json'),
  configObject: {
    projectFolder: process.cwd(),
    mainEntryPointFilePath: 'dist/index.d.ts',
    bundledPackages: [],
    compiler: {
      tsconfigFilePath: './tsconfig.json',
    },
    dtsRollup: {
      enabled: true,
      untrimmedFilePath: 'dist/index.d.mts',
    },
  },
  packageJsonFullPath: path.join(process.cwd(), 'package.json'),
});

const extractorResult = Extractor.invoke(extractorConfig, {
  localBuild: true,
  showVerboseMessages: false,
});

if (extractorResult.succeeded) {
  console.log(`API Extractor completed successfully`);
  process.exitCode = 0;
} else {
  console.error(
    `API Extractor completed with ${extractorResult.errorCount} errors` +
      ` and ${extractorResult.warningCount} warnings`,
  );
  process.exitCode = 1;
}

await $`cp dist/index.d.mts dist/index.d.cts`.pipe(process.stdout);

await $`attw --pack .`.pipe(process.stdout);

console.log(`✅ ${packageName} built successfully`);
