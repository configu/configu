import _ from 'lodash';
import { EvaluatedConfigs } from '@configu/ts';
import { CONFIG_SYNCHRONIZER_LABEL } from '@configu/lib';
import { promises as fs } from 'fs';

const label = CONFIG_SYNCHRONIZER_LABEL.AwsEcs;
const ECS_ERROR_PREFIX = 'Invalid task definition';

export type AwsEcsConfiguration = {
  // * AWS ECS docs: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/taskdef-envfiles.html
  taskDefinition: string;
  containerName: string;
};
type ContainerDefinitionEnvs = { name?: string; value?: string };
type ContainerDefinition = { name: string; environment?: ContainerDefinitionEnvs[] };
type TaskDefinitionObject = {
  containerDefinitions?: ContainerDefinition[];
  [otherKeys: string]: unknown;
};

const updateAwsEcsTaskDefinition = (
  containerName: string,
  taskDef: TaskDefinitionObject,
  envVarsToSyncDict: Record<string, string>,
) => {
  // [NOTE] See https://github.com/aws-actions/amazon-ecs-render-task-definition/blob/master/index.js
  const taskDefClone = _.cloneDeep(taskDef);
  if (!Array.isArray(taskDefClone?.containerDefinitions)) {
    throw new TypeError(`${ECS_ERROR_PREFIX} format: containerDefinitions section is not present or is not an array`);
  }
  const containerDefToChangeIdx = taskDefClone.containerDefinitions.findIndex((containerDef) => {
    return containerDef.name === containerName;
  });

  if (containerDefToChangeIdx === -1) {
    throw new TypeError(`${ECS_ERROR_PREFIX}: Could not find container definition with matching name`);
  }
  const containerDef = taskDefClone.containerDefinitions[containerDefToChangeIdx];
  if (!Array.isArray(containerDef?.environment)) {
    containerDef.environment = [];
  }

  containerDef.environment = Object.entries(envVarsToSyncDict).reduce((taskDefEnvs, config) => {
    const [key, value] = config;

    const newTaskDefEnvs = [...taskDefEnvs];
    const matchedEnvIdx = taskDefEnvs.findIndex((env) => env.name === key);
    if (matchedEnvIdx === -1) {
      newTaskDefEnvs?.push({ name: key, value });
    } else {
      newTaskDefEnvs[matchedEnvIdx] = { name: key, value };
    }
    return newTaskDefEnvs;
  }, containerDef.environment);

  return taskDefClone;
};

export const assignEnvVarsToAwsEcsTaskDef = async ({
  configuration,
  configs,
}: {
  configuration: Partial<AwsEcsConfiguration>;
  configs: EvaluatedConfigs;
}) => {
  const { taskDefinition, containerName } = configuration;
  if (!taskDefinition || !containerName) {
    throw new Error(`${label} credentials are missing`);
  }

  const taskDefContent = await fs.readFile(taskDefinition, 'utf8');
  const taskDef = JSON.parse(taskDefContent);
  const modifiedTaskDef = updateAwsEcsTaskDefinition(containerName, taskDef, configs);
  await fs.writeFile(taskDefinition, JSON.stringify(modifiedTaskDef, null, 2));
};
