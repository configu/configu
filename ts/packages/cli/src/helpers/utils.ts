import { cwd } from 'process';
import path from 'path';

export const { NODE_ENV } = process.env;
export const isDev = NODE_ENV === 'development';

export const getPathBasename = (pathname = cwd()) => path.basename(path.resolve(pathname));
