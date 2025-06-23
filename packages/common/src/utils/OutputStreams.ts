import process from 'node:process';
import { inspect } from 'node:util';
import { _ } from '@configu/sdk';
import Debug from 'debug';
import color from 'picocolors';
import { table as Table, getBorderCharacters } from 'table';

export { inspect, color };

export const print = process.stdout.write.bind(process.stdout);
// we replace stdout with stderr to avoid errors thrown by interfaces like clipanion being captured by the shell and disrupt stdout pipe functionality
process.stdout.write = process.stderr.write.bind(process.stderr);

// https://github.com/debug-js/debug/#output-streams
export const debug = Debug('configu');

type TableData = Parameters<typeof Table>[0];
type TableOptions = Parameters<typeof Table>[1];

export const table = (data: TableData, options?: TableOptions) =>
  Table(data, {
    border: getBorderCharacters('norc'),
    columnDefault: {
      alignment: 'left',
      verticalAlignment: 'middle',
      paddingLeft: 1,
      paddingRight: 1,
    },
    ...options,
  });

export const box = (message: string, level: 'info' | 'warn' | 'error') =>
  Table([[message]], {
    border: _.mapValues(getBorderCharacters('norc'), (value) => {
      switch (level) {
        case 'info':
          return color.blue(value);
        case 'warn':
          return color.yellow(value);
        case 'error':
          return color.red(value);
        default:
          return value;
      }
    }),
    columnDefault: {
      alignment: 'center',
      verticalAlignment: 'middle',
      paddingLeft: 1,
      paddingRight: 1,
    },
  });
