# @configu/azure-app-configuration

Integrates Configu with [Azure App Configuration](https://learn.microsoft.com/azure/azure-app-configuration/).

## Usage

### `.configu` Declaration

```yaml
stores:
  my-store:
    type: azure-app-configuration
    configuration:
      endpoint: https://my-appconfig.azconfig.io
```

### CLI

```bash
# Upsert configs
configu upsert --store "my-store" --set "prod" --schema "./app.cfgu.json" \
  -c "DATABASE_URL=postgres://prod.db/app" \
  -c "API_KEY=sk_prod_123"

# Eval and export
configu eval --store "my-store" --set "prod" --schema "./app.cfgu.json" \
  | configu export
```

## Configuration

```yaml
configuration:
  endpoint: https://my-appconfig.azconfig.io
  options: # Optional - DefaultAzureCredentialOptions
    managedIdentityClientId: ...
    tenantId: ...
```

Find `endpoint` in Azure Portal → App Configuration → Overview.

Authentication uses [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential) which auto-discovers credentials from Azure CLI, managed identity, environment variables, and more. Pass `options` to configure specific authentication methods.

## Storage Strategy

**Each Configu config maps 1:1 to an Azure configuration setting:**

```typescript
// Configu
{ set: "prod", key: "DATABASE_URL", value: "postgres://prod.db" }
  ↓
// Azure App Configuration
{ key: "DATABASE_URL", label: "prod", value: "postgres://prod.db" }
```

**Mapping:**

- `set` → `label` (empty set uses `""` label)
- `key` → `key`
- `value` → `value`

**Rationale:** Azure App Configuration's native [label system](https://learn.microsoft.com/azure/azure-app-configuration/concept-key-value#label-keys) is purpose-built for environment/variant separation. Unlike other cloud config services, labels enable:

- Server-side filtering (`labelFilter: "prod"`)
- Same key across environments without collision
- Individual config metadata (etag, lastModified)
- Hierarchical set organization

**Limitations:**

- [API quotas](https://learn.microsoft.com/azure/azure-app-configuration/concept-quotas-limits) vary by tier (free: 1,000 req/day)
- [Size limit](https://learn.microsoft.com/azure/azure-app-configuration/concept-quotas-limits): 10KB per key+label+value combination
- Each read/write counts as separate API call (no batching)

## References

- [Azure App Configuration Docs](https://learn.microsoft.com/azure/azure-app-configuration/)
- [JavaScript SDK](https://learn.microsoft.com/javascript/api/@azure/app-configuration/)
- [Pricing](https://azure.microsoft.com/pricing/details/app-configuration/)
- [Troubleshooting](https://learn.microsoft.com/azure/azure-app-configuration/howto-best-practices)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/appconfig/kv)
