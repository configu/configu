import {
  SSMClient,
  type SSMClientConfig,
  DeleteParameterCommand,
  GetParameterCommand,
  PutParameterCommand,
  ParameterType,
} from '@aws-sdk/client-ssm';
import { KeyValueConfigStore } from '@configu/ts';

export type AWSParameterStoreConfigStoreConfiguration = SSMClientConfig;

export class AWSParameterStoreConfigStore extends KeyValueConfigStore {
  private client: SSMClient;
  constructor(configuration: AWSParameterStoreConfigStoreConfiguration) {
    super('aws-parameter-store');
    this.client = new SSMClient(configuration);
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/GetParameterCommand/
  async getByKey(key: string): Promise<string> {
    const command = new GetParameterCommand({ Name: key });
    const res = await this.client.send(command);
    return res?.Parameter?.Value ?? '';
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/PutParameterCommand/
  async upsert(key: string, value: string): Promise<void> {
    const command = new PutParameterCommand({ Name: key, Value: value, Type: ParameterType.STRING, Overwrite: true });
    await this.client.send(command);
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/DeleteParameterCommand/
  async delete(key: string): Promise<void> {
    const command = new DeleteParameterCommand({ Name: key });
    await this.client.send(command);
  }
}
