import { downloadTemplate, TemplateProvider, TemplateInfo, GitInfo, providers } from 'giget';

declare module 'giget' {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const providers: Record<GitInfo['provider'], TemplateProvider>;
}

export const ConfiguGitRepo = `github:configu/configu`;

const ConfiguGitTemplate: TemplateProvider = async (input, options) => {
  // input is a "configu-repo-subdir#git-ref" string
  return providers.github(`${ConfiguGitRepo}/${input}`, options) as TemplateInfo;
};

// export const downloadedGitTemplate = async (input: string, dirPath: string, force = false) => {
//   return downloadTemplate(input, { providers: { configu: ConfiguGitTemplate }, dir: dirPath, force });
// };

// export const downloadedGitTemplate = async (template: string, destination: string, force = false) => {
//   // https://unjs.io/packages/giget#examples
//   console.debug('Downloading template:', template);
//   const { source, dir } = await downloadTemplate(template, {
//     dir: destination,
//     force,
//     // forceClean: force,
//     preferOffline: true,
//     registry: false,
//     providers: { configu: ConfiguGitTemplate },
//   });
//   console.debug('Template downloaded:', source, dir);
// };
