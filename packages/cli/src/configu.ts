#!/usr/bin/env node

import { run } from '.';

process.env.CONFIGU_DEBUG = process.env.CONFIGU_DEBUG || process.argv.includes('--debug') ? 'true' : 'false';

run(process.argv.slice(2));
