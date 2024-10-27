# **@configu-integrations/kubernetes-secret-config-store**

Integrates the Configu Orchestrator with [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).

- **Name**: Kubernetes Secrets  
- **Category**: Secret Manager  

---

## **Configuration**

Configu interacts with the Kubernetes API to access and manage secrets. Ensure your application has the correct Kubernetes cluster access permissions. The [Kubernetes client](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) uses the kubeconfig file or in-cluster configuration for authentication.

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
    -c "API_KEY=abcdef12345" \
    -c "DB_PASSWORD=mysecurepassword"
```

#### **Eval and Export Commands**

```bash
configu eval --store "my-k8s-secret-store" --set "test" --schema "./start.cfgu.json" \
 | configu export
```

---

## **Common Errors and Solutions**

1. **Kubernetes Cluster Connection Issues**  
   - **Solution**: Verify that the kubeconfig path is correct and that your user has access to the cluster. You can test the connection with:
     ```bash
     kubectl get nodes
     ```

2. **Missing Permissions**  
   - **Solution**: Ensure that the service account or user has the correct permissions to manage secrets. You can use the following command to assign permissions:
     ```bash
     kubectl create rolebinding configu-secret-access --clusterrole=admin --serviceaccount=default:default
     ```

3. **Namespace Not Found**  
   - **Solution**: Verify that the specified namespace exists in the cluster. List namespaces using:
     ```bash
     kubectl get namespaces
     ```

4. **Secret Not Found or Access Denied**  
   - **Solution**: Confirm the secret's existence and that you have the required permissions to access it. Check secrets with:
     ```bash
     kubectl get secrets -n <namespace>
     ```

---

## **References**

- Integration documentation: [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)  
- Kubernetes API authentication: [Using kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)  

---
