import { stringify } from 'csv-stringify/sync';

const stringifyOptions = {
  header: true,
  delimiter: ',',
};

export const CSV = ({ json }) => stringify([json], stringifyOptions);
