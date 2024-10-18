import type { EvaluationContext, Provider } from '@openfeature/server-sdk';
import { OpenFeatureConfigStore } from '@configu/integrations/src/utils/OpenFeature';
import { SplitFactory } from '@splitsoftware/splitio';
import { OpenFeatureSplitProvider } from '@splitsoftware/openfeature-js-split-provider/src';
import type { Attributes, IClient, SplitKey, Treatment, Treatments } from '@splitsoftware/splitio/types/splitio';

export type SplitConfigStoreConfiguration = {
  authKey: string;
  key?: SplitKey;
  context?: EvaluationContext;
};

export class SplitConfigStore extends OpenFeatureConfigStore {
  private readonly splitClient: IClient;

  constructor(configuration: SplitConfigStoreConfiguration) {
    const { authKey, context } = configuration;
    const splitClient = SplitFactory({ core: { authorizationKey: authKey } }).client();
    const provider = new OpenFeatureSplitProvider({ splitClient }) as Provider;

    super({
      provider,
      context,
    });

    this.splitClient = splitClient;
  }

  getTreatment(featureFlag: string, attributes?: Attributes): Treatment {
    if (attributes) {
      return this.splitClient.getTreatment(featureFlag, attributes);
    }
    return this.splitClient.getTreatment(featureFlag);
  }

  getTreatments(featureFlags: string[], attributes?: Attributes): Treatments {
    if (attributes) {
      return this.splitClient.getTreatments(featureFlags, attributes);
    }
    return this.splitClient.getTreatments(featureFlags);
  }
}
