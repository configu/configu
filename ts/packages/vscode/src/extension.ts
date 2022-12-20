// * important VSCode extension resources:
// * https://code.visualstudio.com/api/references/extension-manifest
// * https://github.com/microsoft/vscode-extension-samples
// * https://snippet-generator.app/

import * as vscode from 'vscode';
import { ConfigSchema } from '@configu/ts';

export const activate = async () => {
  console.log(`${ConfigSchema.CFGU.EXT}${ConfigSchema.EXT} files will now be associated with the extension`);
};

export const deactivate = async () => {
  console.log(`${ConfigSchema.CFGU.EXT}${ConfigSchema.EXT} files will no longer be associated with the extension`);
};
