import path from 'path';
import { cwd } from 'process';

export const { NODE_ENV } = process.env;
export const isDev = NODE_ENV === 'development';
export const configuStoreType = 'configu';

// directory: returns the directory name
// file: return the file name with extension
export const getPathBasename = (fullPath = cwd()) => path.basename(path.resolve(fullPath));
