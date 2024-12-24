# @configu/azure-keyvault

Integrates the Configu Orchestrator with [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/).

- Name: Azure Key Vault
- Category: Secret manager

## Configuration

Configu needs to be authorized to access Azure Key Vault. Configu uses the [default azure credentials](https://www.npmjs.com/package/@azure/identity#defaultazurecredential) which by default will read account information specified via [environment variables](https://www.npmjs.com/package/@azure/identity#environment-variables) and use it to authenticate. The `vaultUrl` parameter must always be provided.

The examples below will use the following environment variables for authentication: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` in conjunction with the required `vaultUrl` parameter.

## Limitations

- Deleted configs do not immediately remove secrets [due to soft deletion](https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview). Attempting to upsert to a deleted secret that is not purged will throw an error.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: azure-key-vault
    configuration:
      credential: {}
      vaultUrl: https://my-vault.vault.azure.net/
```

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "GREETING=hey" \
    -c "SUBJECT=configu"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common errors and solutions

1. Authentication failure

   - Solution: Ensure the correct `clientId`, `clientSecret`, and `tenantId` are provided. Verify the service principal's permissions in the Azure portal.

2. Vault not found

   - Solution: Ensure the `vaultUrl` is correct and the key vault exists in your Azure subscription. Verify with:
     ```bash
     az keyvault show --name my-vault
     ```

3. Access denied

   - Solution: Make sure the service principal has the necessary access policy to manage secrets. Use the following command to grant permissions:
     ```bash
     az keyvault set-policy --name my-vault --spn <your-client-id> --secret-permissions get list set delete
     ```

4. Network connectivity issues
   - Solution: Verify that your network allows access to the vault endpoint. Test the connectivity with:
     ```bash
     curl -I https://my-vault.vault.azure.net/
     ```

## References

- Integration documentation: https://docs.aws.amazon.com/secretsmanager
- Azure Identity SDK: https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-v2-libraries
