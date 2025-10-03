# @configu/hashicorp-vault

Integrates the Configu Orchestrator with [HashiCorp Vault](https://www.vaultproject.io/).

- Name: HashiCorp Vault
- Category: Secret manager

## Configuration

Configu needs to be authorized to access your HashiCorp vault account. For this, you need to provide the following parameters: `address`, `engine`, `token`. By default, Configu attempts to use the following environment variables for the vault address and token: `VAULT_ADDR`, `VAULT_TOKEN`. The `engine` parameter must always be provided.

## Limitations

- Only supports the K/V2 engine.
- Does not support root set (E.g. `configu upsert --set "/"`).

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: hashicorp-vault
    configuration:
      address: https://vault.example.com
      token: example-token
      engine: example-engine
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

## Common errors and solutions

1. Authentication failure
   - Solution: Ensure the provided `token` is valid and has sufficient permissions. Verify the token with:
     ```bash
     vault token lookup
     ```

2. Timeout issues
   - Solution: Increase the `timeout` value in the configuration if the Vault server takes longer to respond.

3. Path not Found
   - Solution: Ensure the provided `path` exists and the token has access to it. Use:
     ```bash
     vault list secret/
     ```

4. Certificate errors in HTTPS connections
   - Solution: If using HTTPS, ensure that the correct CA certificates are configured. Use the `VAULT_CACERT` environment variable to specify the certificate path:
     ```bash
     export VAULT_CACERT=/path/to/ca.pem
     ```

## References

- Integration documentation: https://www.vaultproject.io/docs
