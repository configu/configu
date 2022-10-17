import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import _ from 'lodash';
import { Store, StoreQuery, StoreContents } from '@configu/ts';

// ! supports JSON secrets only
export class GcpSecretManagerStore extends Store {
  static readonly protocol = 'gcp-secret-manager';
  private client: SecretManagerServiceClient;
  constructor(keyFile: string) {
    super(GcpSecretManagerStore.protocol, { supportsGlobQuery: false }); // TODO - supportsGlobQuery?

    this.client = new SecretManagerServiceClient({ keyFile });
  }

  get(query: StoreQuery): Promise<StoreContents> {
    throw new Error('Method not implemented.');
  }

  set(configs: StoreContents): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
