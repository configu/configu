import { type Cfgu, type Config } from '@configu/ts';
import Dotenv from 'dotenv';
import _ from 'lodash';
import { analyzeValueType } from './configAnalyzer';
import { type ConfigFormat, CONFIG_FORMAT_EXTENSION } from '../formatters';

type ConfigExtractorFormat = Extract<ConfigFormat, 'JSON' | 'Dotenv'>;

type ExtractorParameters = { content: string };
type ExtractorFunction = (params: ExtractorParameters) => Record<string, string>;

const FORMAT_TO_EXTENSION_DICT: Record<ConfigExtractorFormat, string> = _.pick(CONFIG_FORMAT_EXTENSION, [
  'JSON',
  'Dotenv',
]);

const FILE_CONTENT_FORMAT_ERROR =
  'file content is not in a valid format. for more info on supported formats read here: https://configu.com/docs';
const NOT_FLAT_JSON_ERROR = 'only flat .json files are supported. read more here: https://configu.com/docs';

const CONFIG_EXTRACTORS: Record<ConfigExtractorFormat, ExtractorFunction> = {
  Dotenv: ({ content }) => Dotenv.parse(content),
  JSON: ({ content }) => {
    const extractedKeys = JSON.parse(content) as Record<'string', 'string'>;
    if (Array.isArray(extractedKeys)) {
      throw new Error(NOT_FLAT_JSON_ERROR);
    }
    Object.entries(extractedKeys).forEach(([key, value]) => {
      if (typeof value === 'object') {
        throw new Error(NOT_FLAT_JSON_ERROR);
      }
    });
    return extractedKeys;
  },
};

type ExtractConfigParameters = {
  filePath: string;
  fileContent: string;
  options?: {
    useValuesAsDefaults?: boolean;
    analyzeValuesTypes?: boolean;
  };
};
type ExtractedConfig = Pick<Config, 'key' | 'value'> & { cfgu: Pick<Cfgu, 'type' | 'default'> };

export const extractConfigs = ({
  filePath,
  fileContent,
  options = {},
}: ExtractConfigParameters): Record<string, ExtractedConfig> => {
  if (!fileContent) {
    throw new Error('cannot import an empty file');
  }

  // * lowercase the extension in order to handle case sensitivity issues for example: .JSON, .json .ENV, .env etc
  const fileFormat = _.findKey(FORMAT_TO_EXTENSION_DICT, (ext) => filePath.toLowerCase().includes(`.${ext}`));
  const extractor = CONFIG_EXTRACTORS[fileFormat as ConfigExtractorFormat];
  if (!fileFormat || !extractor) {
    throw new Error(
      'file format is not supported. for more info on supported file formats to import: https://configu.com/docs',
    );
  }

  const rawExtractedConfig = extractor?.({ content: fileContent }) ?? {};

  const configs = _.mapValues(rawExtractedConfig, (value, key) => {
    return {
      key,
      value,
      cfgu: {
        type: options.analyzeValuesTypes ? analyzeValueType(value) : 'String',
        ...(options.useValuesAsDefaults && { default: value }),
      },
    };
  });

  if (_.isEmpty(configs)) {
    throw new Error(FILE_CONTENT_FORMAT_ERROR);
  }

  return configs;
};
