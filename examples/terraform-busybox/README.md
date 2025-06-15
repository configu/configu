# 🐳 Terraform + Docker + Configu

This example shows how to use [Configu](https://configu.com) to manage configuration for a Docker container provisioned with Terraform. It’s terminal-only, using the `configu` CLI and `terraform` CLI directly.

## 📦 Tools

- [Terraform](https://developer.hashicorp.com/terraform/downloads)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Configu CLI](https://docs.configu.com/docs/cli/overview)

## Structure

TBD

## 🚀 Usage

### 1. Init Terraform

```bash
terraform init
```

### 2. Generate `.tfvars` from Configu input

```bash
configu eval --schema 'variables.cfgu.yaml' --set 'prod' | configu export --format 'tfvars' > terraform.tfvars
```

### 3. Apply Terraform configuration

```bash
terraform apply -auto-approve
```

### 4. Capture Terraform outputs

```bash
# terraform output -json > tf_output.json
terraform output -json | jq 'map_values(.value)' > outputs.json
```

### 5. Upsert outputs to Configu

```bash
configu upsert --schema 'outputs.cfgu.yaml' --set 'prod' --from-file outputs.json
```

## 🔍 Inspect

To confirm that the environment variable was injected correctly:

```bash
configu eval --schema 'variables.cfgu.yaml' --set 'prod' | configu export --run 'docker logs $container_name'
```

### 🧹 Teardown

To clean up everything provisioned by Terraform:

```bash
terraform destroy -auto-approve
```

To also remove the Terraform state and generated files:

```bash
rm -f terraform.tfstate terraform.tfstate.backup terraform.tfvars outputs.json
```

To verify that the container is gone:

```bash
docker ps -a
```

If needed, you can manually prune Docker containers and images:

```bash
docker container prune   # removes all stopped containers
docker image prune       # removes dangling images
```

## ✅ Result

- Config-driven provisioning of Docker containers
- Clean separation of inputs and outputs
- Environment variables injected at runtime
- Ideal workflow for CI/CD or local testing
