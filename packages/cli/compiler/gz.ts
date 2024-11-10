import { createGzip } from 'node:zlib';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export async function compress(input) {
  console.log('compressing', `${input}.gz`);
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(`${input}.gz`);
  await pipeline(source, gzip, destination);
}
