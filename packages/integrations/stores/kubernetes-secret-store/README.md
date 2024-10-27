# **@configu-integrations/kubernetes-secret-store**

Integrates the Configu Orchestrator with [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).  

- **Name**: Kubernetes Secrets  
- **Category**: Secret Manager  

---

## **Configuration**

Configu interacts with the Kubernetes API to read and manage secrets. It uses the [kubeconfig file](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/) or in-cluster configuration for authentication. Ensure that your application has the necessary permissions to access the Kubernetes secrets.

### **`.configu` Store Declaration**

```yaml
stores:
  my-k8s-secret-store:
    type: kubernetes-secret
    configuration:
      namespace: default
      kubeconfig: ~/.kube/config
```

---

### **CLI Examples**

#### **Upsert Command**

```bash
configu upsert --store "my-k8s-secret-store" --set "test" --schema "./start.cfgu.json" \
    -c "DB_PASSWORD=mysecretpassword" \
    -c "API_TOKEN=12345abcdef"
```

#### **Eval and Export Commands**

```bash
configu eval --store "my-k8s-secret-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

---

## **Common Errors and Solutions**

1. **Cluster Access Issues**  
   - **Solution**: Ensure that the kubeconfig path is correct and that your user or service account has access to the cluster. Test connectivity with:
     ```bash
     kubectl get nodes
     ```

2. **Insufficient Permissions**  
   - **Solution**: Make sure your account has `GET`, `CREATE`, and `UPDATE` permissions for secrets. Use the following command to grant access:
     ```bash
     kubectl create rolebinding configu-access --clusterrole=admin --serviceaccount=default:default
     ```

3. **Namespace Not Found**  
   - **Solution**: Verify that the specified namespace exists by listing all available namespaces:
     ```bash
     kubectl get namespaces
     ```

4. **Secret Access Errors**  
   - **Solution**: Check that the target secret exists and the user has proper access permissions. Use:
     ```bash
     kubectl get secrets -n <namespace>
     ```

---

## **References**

- Integration documentation: [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)  
- Kubernetes authentication: [Kubeconfig Guide](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)  

---

