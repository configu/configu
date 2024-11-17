import { ConfigExpression } from '@configu/sdk';
import YAML from 'yaml';
import { z } from 'zod';
import validator from 'validator';
import * as changeCase from 'change-case';

ConfigExpression.register('YAML', YAML);
ConfigExpression.register('z', z);
ConfigExpression.register('validator', validator);
ConfigExpression.register('Casing', changeCase);
