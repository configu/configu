# @configu/hcp-vault-secrets

Integrates the Configu Orchestrator with [HCP Vault Secrets](https://developer.hashicorp.com/hcp/docs/vault-secrets).

- Name: HCP Vault Secrets
- Category: Secret manager

## Configuration

Configu needs to be authorized to access your HCP account. For this, you need to provide the following parameters: `organization`, `project`, `app`, `clientId`, `clientSecret`. By default, Configu attempts to use the following environment variables for the vault address and token: `HCP_CLIENT_ID`, `HCP_CLIENT_SECRET`, `HCP_API_TOKEN`.

## Limitations

- Only supports the `kv` typed secrets - `static secret`.
- Does not support root set (E.g. `configu upsert --set "/"`).

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: hcp-vault-secrets
    configuration:
      organization: example-org
      project: example-project
      app: example-app
      clientId: example-client-id
      clientSecret: example-client-secret
```

### CLI examples

#### Upsert command

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

## References

- Integration documentation: https://developer.hashicorp.com/hcp/docs/vault-secrets
