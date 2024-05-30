# @configu/examples/terraform

- Upsert config from `./variables.tf`
  ```bash
  configu upsert --store 'configu' --set 'examples/terraform' --schema './terraform-variables.cfgu.json' -c "container_name=TerraformConfiguExampleNginxContainer"
  ```
- Export to `terraform.tfvars`
  ```bash
  configu eval --store 'configu' --set 'examples/terraform' --schema './terraform-variables.cfgu.json' | configu export --format 'TerraformTfvars' > terraform.tfvars
  ```
- Run terraform commands
  ```bash
  terraform init
  terraform apply -var-file="terraform.tfvars"
  ```
- Upsert config from `./outputs.tf`
  ```bash
   configu upsert --store 'configu' --set 'examples/terraform' --schema './terraform-outputs.cfgu.json' -c "container_id=$(terraform output -raw container_id)" -c "image_id=$(terraform output -raw image_id)"
  ```
  > Tip: you can also use the `provisioner "local-exec"` in main.tf#L28 to do it.
