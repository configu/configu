import { ClientSecretCredential } from '@azure/identity';
import { WebSiteManagementClient } from '@azure/arm-appservice';
import { EvaluatedConfigs } from '@configu/ts';
import { CONFIG_SYNCHRONIZER_LABEL } from '@configu/lib';

const label = CONFIG_SYNCHRONIZER_LABEL.AzureFunctions;

export type AzureFunctionsConfiguration = {
  // * Azure functions docs: TODO
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  resourceGroupName: string;
  functionApp: string;
};

export const syncAzureFunctionsConfigs = async ({
  configuration,
  configs,
}: {
  configuration: Partial<AzureFunctionsConfiguration>;
  configs: EvaluatedConfigs;
}) => {
  const { tenantId, clientId, clientSecret, subscriptionId, resourceGroupName, functionApp } = configuration;
  if (!tenantId || !clientId || !clientSecret || !subscriptionId || !resourceGroupName || !functionApp) {
    throw new Error(`${label} credentials are missing`);
  }

  const client = new WebSiteManagementClient(
    new ClientSecretCredential(tenantId, clientId, clientSecret),
    subscriptionId,
  );

  const currentSettings = await client.webApps.listApplicationSettings(resourceGroupName, functionApp);

  await client.webApps.updateApplicationSettings(resourceGroupName, functionApp, {
    ...currentSettings,
    properties: {
      ...currentSettings.properties,
      ...configs,
    },
  });
};
