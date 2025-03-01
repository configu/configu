import { fileURLToPath, URL } from 'node:url';
import path from 'pathe';
import isGlob from 'is-glob';
import { TemplateProviders } from './Modules';

export const normalizeInput = (
  input: string,
  source: string,
): {
  type: 'json' | 'file' | 'glob' | 'http' | 'template';
  path: string;
} => {
  // Check if the string is a valid JSON
  try {
    JSON.parse(input);
    return { type: 'json', path: '' };
  } catch {
    // Not a JSON string
  }

  // Check if the string is a valid URL
  try {
    const url = new URL(input);
    if (url.protocol === 'file:') {
      return { type: 'file', path: fileURLToPath(url) };
    }
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { type: 'http', path: input };
    }
    if (Object.keys(TemplateProviders).includes(url.protocol.slice(0, -1))) {
      return { type: 'template', path: input };
    }
  } catch {
    // Not a valid URL
  }

  // Check if the string is a valid path
  try {
    path.resolve(input);
    if (isGlob(input)) {
      return { type: 'glob', path: input };
    }
    return { type: 'file', path: input };
  } catch {
    // Not a valid path
  }

  throw new Error(`${source} input is not a valid path, URL, or JSON`);
};

// todo: create test cases for normalizeInput
// [
//   `./ran/michal`,
//   `C:\\ran\\michal`,
//   `./ran/michal/`,
//   `./ran/michal.txt`,
//   `file://ran/michal`,
//   `file://ran/`,
//   `file:ran/`,
//   `file:ran/michal.txt`,
//   `*.cfgu.{json,yaml}`,
//   'configu:packages/stores/configu-platform#main',
// ].forEach((input) => {
//   console.log(normalizeInput(input, 'source'));
// });
