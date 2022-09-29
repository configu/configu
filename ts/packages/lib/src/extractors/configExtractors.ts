import { parse } from 'dotenv';
import _ from 'lodash';
import { ConfigSchema, ConfigSchemaType } from '@configu/ts';
import { analyzeValueType } from './configAnalyzer';
import { ConfigFormat } from '../formatters';

type ConfigExtractorFormat = Extract<ConfigFormat, 'JSON' | 'Dotenv'>;

const EXTENSION_TO_FORMAT_DICT: Record<string, ConfigExtractorFormat> = {
  json: 'JSON',
  env: 'Dotenv',
};

export const getFileExtension = (filename: string) => {
  return _(filename).split('.').last();
};

type ExtractorParameters = { content: string };
type ExtractorFunction = (params: ExtractorParameters) => Record<string, string>;

const FILE_CONTENT_FORMAT_ERROR =
  'file content is not in a valid format. for more info on supported formats read here: https://configu.com/docs';
const NOT_FLAT_JSON_ERROR = 'only flat .json files are supported. read more here: https://configu.com/docs';

const configExtractors: Record<ConfigExtractorFormat, ExtractorFunction> = {
  Dotenv: ({ content }) => parse(content),
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
type ExtractedConfig = { key: string; value: string; schema: Pick<ConfigSchema, 'type' | 'default'> };

export const extractConfigs = ({ filePath, fileContent, options = {} }: ExtractConfigParameters): ExtractedConfig[] => {
  if (!fileContent) {
    throw new Error('cannot import an empty file');
  }

  // * lowercase the extension in order to handle case sensitivity issues for example: .JSON, .json .ENV, .env etc
  const fileExtension = getFileExtension(filePath)?.toLowerCase();
  if (!fileExtension || !EXTENSION_TO_FORMAT_DICT[fileExtension]) {
    throw new Error('file type not supported. see here for supported file types to import: https://configu.com/docs');
  }
  const format = EXTENSION_TO_FORMAT_DICT?.[fileExtension];
  const extractor = configExtractors[format];
  if (!extractor) {
    throw new Error(`${format} is not supported`);
  }

  const rawExtractedConfig = extractor?.({ content: fileContent }) ?? {};

  const configs = Object.entries(rawExtractedConfig).map(([key, value]) => {
    return {
      key,
      value,
      schema: {
        type: options.analyzeValuesTypes ? analyzeValueType(value) : ConfigSchemaType.String,
        ...(options.useValuesAsDefaults && { default: value }),
      },
    };
  });

  if (_.isEmpty(configs)) {
    throw new Error(FILE_CONTENT_FORMAT_ERROR);
  }

  return configs;
};
