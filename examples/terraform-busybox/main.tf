terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

provider "docker" {
  host = "unix:///Users/ran/.docker/run/docker.sock"
}

resource "docker_image" "busybox_image" {
  name         = "busybox:${var.image_tag}"
  keep_locally = false
}

resource "docker_container" "busybox_container" {
  image = docker_image.busybox_image.image_id
  name  = var.container_name
  env = [
    var.container_env
  ]
  command = ["sh", "-c", "env && sleep 360"]
}
