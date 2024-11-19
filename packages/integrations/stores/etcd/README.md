# @configu-integrations/etcd

Integrates the Configu Orchestrator with [etcd](https://etcd.io/).

- Name: etcd
- Category: Key-value store

## Configuration

Configu needs to be authorized to access your etcd store. You may pass [options into the etcd client constructor](https://microsoft.github.io/etcd3/interfaces/ioptions.html) to configure how the client connects to etcd.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: etcd
    configuration:
      hosts:
        - http://localhost:2379
        - http://localhost:2380
      username: <your-username> # Optional
      password: <your-password> # Optional
```

### CLI examples

#### Upsert command

```bash
configu upsert --store "my-store" --set "test" --schema "./start.cfgu.json" \
    -c "APP_MODE=production" \
    -c "RETRY_COUNT=5"
```

#### Eval and export commands

```bash
configu eval --store "my-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common errors and solutions

1. Connection timeout  
   - Solution: Ensure the `hosts` URLs are reachable from your application. Increase the `timeout` value if the network latency is high.

2. Authentication failure  
   - Solution: If authentication is enabled, verify the provided `username` and `password`. Test with:
     ```bash
     etcdctl --user <username>:<password> endpoint status
     ```

3. Cluster unavailability  
   - Solution: Ensure that all nodes in the etcd cluster are healthy. Use the following command to check cluster health:
     ```bash
     etcdctl endpoint health
     ```

4. Key collision issues  
   - Solution: Use unique keys or prefixes for different configuration sets to avoid conflicts.

## References

- Integration documentation: https://etcd.io/docs
- Integration SDK documentation: https://microsoft.github.io/etcd3/classes/etcd3.html
