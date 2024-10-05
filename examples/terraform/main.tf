# https://developer.hashicorp.com/terraform/tutorials/docker-get-started

terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {}
#creating nginx image with latest tag for docker
resource "docker_image" "nginx" {
  name         = "nginx:latest"
  keep_locally = false
}

resource "docker_container" "nginx" {
  image = docker_image.nginx.image_id
  name  = var.container_name
  ports {
    internal = 80
    external = 8080
  }
}

# resource "null_resource" "configu" {
#   provisioner "local-exec" {
#     command = <<EOT
#       configu upsert --store 'configu' --set 'examples/terraform' --schema './terraform-outputs.cfgu.json' \
#         -c 'container_id=${docker_container.nginx.id}' -c 'image_id=${docker_image.nginx.id}'
#     EOT
#   }
# }
