# @configu-integrations/etcd-config-store

Integrates the Configu Orchestrator with [etcd](https://etcd.io/), a distributed key-value store for configuration management and service discovery.  

- Name: etcd Config Store  
- Category: Key-Value Store  

---

## Configuration

Configu connects to the etcd cluster to manage configurations through API endpoints. You need to provide connection details, including the host, port, and optional authentication credentials if required.  

## Usage

### `.configu` store declaration

```yaml
stores:
  my-etcd-store:
    type: etcd
    configuration:
      hosts:
        - http://localhost:2379
        - http://localhost:2380
      username: <your-username> # Optional
      password: <your-password> # Optional
      timeout: 5000 # in milliseconds
```

### CLI Examples

#### Upsert Command

```bash
configu upsert --store "my-etcd-store" --set "test" --schema "./start.cfgu.json" \
    -c "APP_MODE=production" \
    -c "RETRY_COUNT=5"
```

#### Eval and Export Commands

```bash
configu eval --store "my-etcd-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common Errors and Solutions

1. Connection Timeout  
   - Solution: Ensure the `hosts` URLs are reachable from your application. Increase the `timeout` value if the network latency is high.

2. Authentication Failure  
   - Solution: If authentication is enabled, verify the provided `username` and `password`. Test with:
     ```bash
     etcdctl --user <username>:<password> endpoint status
     ```

3. Cluster Unavailability  
   - Solution: Ensure that all nodes in the etcd cluster are healthy. Use the following command to check cluster health:
     ```bash
     etcdctl endpoint health
     ```

4. Key Collision Issues  
   - Solution: Use unique keys or prefixes for different configuration sets to avoid conflicts.

## References

- Integration documentation:https://etcd.io/docs 
- CLI tool: https://etcd.io/docs/latest/dev-guide/interacting_v3/
