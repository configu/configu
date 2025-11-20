import { fileURLToPath, URL } from 'node:url';
import path from 'pathe';
import isGlob from 'is-glob';
import { YAML } from './Misc';
import { TemplateProviders } from './Modules';

export const normalizeInput = (
  input: string,
  source: string,
): {
  type: 'json' | 'yaml' | 'file' | 'glob' | 'http' | 'template';
  path: string;
} => {
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

  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(input);
      return { type: 'json', path: '' };
    } catch {
      // Not valid JSON
    }
  }

  const hasNewlines = trimmed.includes('\n');
  const hasYamlKeyPattern = /^[a-zA-Z_][\w-]*:\s*/m.test(trimmed);
  const isLongString = trimmed.length > 100;
  if (hasNewlines || hasYamlKeyPattern || isLongString) {
    try {
      const parsed = YAML.parse(input);
      // Must be an object or array (not a primitive value)
      if (typeof parsed === 'object' && parsed !== null) {
        return { type: 'yaml', path: '' };
      }
    } catch {
      // Not valid YAML
    }
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

  throw new Error(`${source} input is not a valid path, URL, JSON, or YAML`);
};

// // todo: create test cases for normalizeInput
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
//   'https://example.com/schema.cfgu',
//   '{"KEY": "value"}',
//   '{"incomplete":',
//   'KEY: value',
//   'KEY1:\n  type: String\nKEY2:\n  type: Number',
//   './schema.cfgu',
//   '/absolute/path/to/schema.cfgu',
//   'C:/Users/ran/schema.cfgu',
//   'C: value',
//   'true',
//   '123',
//   'schema',
//   'C:/Users/file.txt',
// ].forEach((input) => {
//   console.log(normalizeInput(input, 'source'));
// });

// // Test cases that prove it's holistic:

// // URLs
// normalizeInput('https://example.com/schema.cfgu', 'test'); // → http
// normalizeInput('file:///path/to/file', 'test'); // → file

// // Globs
// normalizeInput('*.cfgu', 'test'); // → glob
// normalizeInput('**/*.cfgu.{json,yaml}', 'test'); // → glob

// // Existing files (if they exist)
// normalizeInput('./schema.cfgu', 'test'); // → file (if exists)
// normalizeInput('/dev/fd/63', 'test'); // → file (if exists)

// // JSON
// normalizeInput('{"KEY": "value"}', 'test'); // → json
// normalizeInput('[1,2,3]', 'test'); // → json
// normalizeInput('{"incomplete":', 'test'); // → file (invalid JSON)

// // YAML inline
// normalizeInput('KEY1:\n  type: String', 'test'); // → yaml (has \n)
// normalizeInput('KEY: value', 'test'); // → yaml (matches pattern)
// normalizeInput('api_key: secret', 'test'); // → yaml (matches pattern)

// // File paths (not YAML)
// normalizeInput('./schema.cfgu', 'test'); // → file (no newlines, no pattern)
// normalizeInput('C:/Users/file.txt', 'test'); // → file (: not followed by space)
// normalizeInput('schema', 'test'); // → file (simple string)
// normalizeInput('123', 'test'); // → file (YAML parses to primitive)
// normalizeInput('true', 'test'); // → file (YAML parses to primitive)
// normalizeInput('C: value', 'test'); // → yaml (edge case - matches pattern)

// // Command substitution YAML
// normalizeInput('KEY1:\n  type: String\nKEY2:\n  type: Number', 'test'); // → yaml

// // URLs
// normalizeInput('https://example.com/schema.cfgu', 'test'); // → http
// normalizeInput('file:///path/to/schema.cfgu', 'test'); // → file

// // Globs
// normalizeInput('*.cfgu', 'test'); // → glob
// normalizeInput('**/*.cfgu.{json,yaml}', 'test'); // → glob

// // Existing files (assuming they exist)
// normalizeInput('./schema.cfgu', 'test'); // → file (if exists)
// normalizeInput('/absolute/path/schema.cfgu', 'test'); // → file (if exists)
// // JSON inline
// normalizeInput('{"KEY": {"type": "String"}}', 'test'); // → json
// normalizeInput('[{"key": "value"}]', 'test'); // → json

// // YAML inline
// normalizeInput('KEY1:\n  type: String', 'test'); // → yaml
// normalizeInput('KEY: { type: String }', 'test'); // → yaml
// // File paths that don't exist yet
// normalizeInput('./new-schema.cfgu', 'test'); // → file (doesn't exist)
// normalizeInput('schema', 'test'); // → file (simple string)
