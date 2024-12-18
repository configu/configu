import { readdir, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function renameBundledArtifacts(): Promise<void> {
  const directoryPath = join(__dirname, '../../dist');

  try {
    // Read all files in the './dist' directory
    const files = await readdir(directoryPath);

    // Iterate through each file in the directory
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      // Check if the file ends with '.os-*.js'
      if (/\.os-.*\.js$/.test(file)) {
        const newFileName = file.replace('os-', '');
        const oldFilePath = join(directoryPath, file);
        const newFilePath = join(directoryPath, newFileName);

        // Rename the file
        // eslint-disable-next-line no-await-in-loop
        await rename(oldFilePath, newFilePath);
        console.log(`Renamed ${file} to ${newFileName}`);
      }
    }
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

renameBundledArtifacts();
