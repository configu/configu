# @configu-integrations/azure-key-vault-config-store

Integrates the Configu Orchestrator with [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/).  

- Name: Azure Key Vault  
- Category: Secret Manager  

## Configuration

Configu interacts with Azure Key Vault to manage secrets, keys, and certificates. You need to provide authentication details and specify the key vault's URL. Configu uses [Azure Identity SDK](https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-v2-libraries) for secure authentication.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-azure-keyvault-store:
    type: azure-key-vault
    configuration:
      vaultUrl: https://my-vault.vault.azure.net/
      clientId: <your-client-id>
      clientSecret: <your-client-secret>
      tenantId: <your-tenant-id>
```

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-azure-keyvault-store" --set "test" --schema "./start.cfgu.json" \
    -c "STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=..." \
    -c "API_KEY=12345abcdef"
```

#### Eval and Export Commands

```bash
configu eval --store "my-azure-keyvault-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

1. Authentication Failure
   - Solution: Ensure the correct `clientId`, `clientSecret`, and `tenantId` are provided. Verify the service principal's permissions in the Azure portal.

2. Vault Not Found
   - Solution: Ensure the `vaultUrl` is correct and the key vault exists in your Azure subscription. Verify with:
     ```bash
     az keyvault show --name my-vault
     ```

3. Access Denied  
   - Solution: Make sure the service principal has the necessary access policy to manage secrets. Use the following command to grant permissions:
     ```bash
     az keyvault set-policy --name my-vault --spn <your-client-id> --secret-permissions get list set delete
     ```

4. Network Connectivity Issues 
   - Solution: Verify that your network allows access to the vault endpoint. Test the connectivity with:
     ```bash
     curl -I https://my-vault.vault.azure.net/
     ```

## References

- Integration documentation: https://learn.microsoft.com/en-us/azure/key-vault/
- Azure Identity SDK: https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-v2-libraries

