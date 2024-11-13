import { dump as ymlStringify } from 'js-yaml';

export const YAML = ({ json }) => ymlStringify(json);
