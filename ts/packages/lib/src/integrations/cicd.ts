export type CiCd =
  | 'GitHubActions'
  | 'CircleCI'
  | 'GitLabCICD'
  | 'AzurePipelines'
  | 'BitbucketPipelines'
  | 'TeamCity'
  | 'Buddy'
  | 'Jenkins'
  | 'Codefresh';

export const CI_CD_LABEL: Record<CiCd, string> = {
  GitHubActions: 'GitHub Actions',
  CircleCI: 'Circle CI',
  GitLabCICD: 'GitLab CI/CD',
  AzurePipelines: 'Azure DevOps Pipelines',
  BitbucketPipelines: 'Bitbucket Pipelines',
  TeamCity: 'TeamCity',
  Buddy: 'Buddy',
  Jenkins: 'Jenkins',
  Codefresh: 'Codefresh',
};
export const CI_CD_WEBSITE: Record<CiCd, string> = {
  GitHubActions: 'https://github.com/features/actions',
  CircleCI: 'https://circleci.com/',
  GitLabCICD: 'https://docs.gitlab.com/ee/ci/',
  AzurePipelines: 'https://docs.microsoft.com/en-us/azure/devops/pipelines/?view=azure-devops',
  BitbucketPipelines: 'https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/',
  TeamCity: 'https://www.jetbrains.com/teamcity/learn/',
  Buddy: 'https://buddy.works/docs',
  Jenkins: 'https://www.jenkins.io/',
  Codefresh: 'https://codefresh.io/',
};

export const CI_CD_TYPE = Object.keys(CI_CD_LABEL) as CiCd[];
