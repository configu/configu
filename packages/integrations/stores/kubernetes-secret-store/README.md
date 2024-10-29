# @configu-integrations/kubernetes-secret-store

Integrates the Configu Orchestrator with [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).  

- Name: Kubernetes Secrets
- Category: Secret manager

## Configuration

Configu needs to be authorized to access your Kubernetes Secret instance. By default, Configu attempts to [load the default kubeconfig credentials](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable) via the `KUBECONFIG` environment variable. You can manually provide credentials via a kubeconfig file via the `kubeconfig` parameter. The `namespace` parameter must always be provided.

## Usage

### `.configu` store declaration

```yaml
stores:
  my-store:
    type: kubernetes-secret
    configuration:
      namespace: default
      kubeconfig: ~/.kube/config
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
configu eval --store "my-k8s-secret-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

## Common errors and solutions

1. Cluster Access Issues  
   - Solution: Ensure that the kubeconfig path is correct and that your user or service account has access to the cluster. Test connectivity with:
     ```bash
     kubectl get nodes
     ```

2. Insufficient Permissions  
   - Solution: Make sure your account has `GET`, `CREATE`, and `UPDATE` permissions for secrets. Use the following command to grant access:
     ```bash
     kubectl create rolebinding configu-access --clusterrole=admin --serviceaccount=default:default
     ```

3. Namespace Not Found  
   - Solution: Verify that the specified namespace exists by listing all available namespaces:
     ```bash
     kubectl get namespaces
     ```

4. Secret Access Errors  
   - Solution: Check that the target secret exists and the user has proper access permissions. Use:
     ```bash
     kubectl get secrets -n <namespace>
     ```

## References

- Integration documentation: https://kubernetes.io/docs/concepts/configuration/secret
- Kubernetes authentication: https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig


