import { Flags } from '@oclif/core';
import { AwsEcsFlags } from '@configu/lib';
import { FlagsType, ExtractorFunction } from './types';

export const AWS_ECS_FLAGS: FlagsType<AwsEcsFlags> = {
  'aws-ecs-task-definition': Flags.string({ env: 'ECS_TASK_DEF_PATH', dependsOn: ['aws-ecs-container-name'] }),
  'aws-ecs-container-name': Flags.string({ env: 'ECS_CONTAINER_NAME', dependsOn: ['aws-ecs-task-definition'] }),
};

export const extractAwsEcsFlags: ExtractorFunction = ({ flags }) => ({
  taskDefinition: flags['aws-ecs-task-definition'],
  containerName: flags['aws-ecs-container-name'],
});
