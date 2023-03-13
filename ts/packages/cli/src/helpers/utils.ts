import { cwd } from 'process';
import path from 'path';
import querystring from 'querystring';

export const getPathBasename = (pathname = cwd()) => path.basename(path.resolve(pathname));

export const CS = {
  parse: (cs: string) => querystring.parse(cs, ';'),
  serialize: (dict: Record<string, string | undefined>) => querystring.stringify(dict, ';'),
};
