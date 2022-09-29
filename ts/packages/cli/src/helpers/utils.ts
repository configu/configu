import { cwd } from 'process';
import path from 'path';

export const getPathBasename = (pathname = cwd()) => path.basename(path.resolve(pathname));
