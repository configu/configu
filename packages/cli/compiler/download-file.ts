import { pipeline } from 'node:stream/promises';
import https from 'node:https';
import fs from 'node:fs';

export async function downloadFile(url: string, destination: string) {
  await pipeline(
    await new Promise<NodeJS.ReadableStream>((resolve, reject) => {
      https
        .get(url, (response) => {
          if (response.statusCode !== 302 && response.statusCode !== 200) {
            reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}: ${url}`));
            return;
          }
          resolve(response);
        })
        .on('error', reject);
    }),
    fs.createWriteStream(destination),
  );
}
