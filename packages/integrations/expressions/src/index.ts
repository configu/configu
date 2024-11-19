import { ConfigExpression } from '@configu/sdk';
import YAML from 'yaml';
import { z } from 'zod';
import validator from 'validator';
import * as changeCase from 'change-case';

ConfigExpression.register('YAML', YAML);
ConfigExpression.register('Casing', changeCase);

ConfigExpression.register('z', z);
ConfigExpression.register('validator', validator);

// export { assert, should } from 'chai'
// export { chai, globalExpect as expect }
