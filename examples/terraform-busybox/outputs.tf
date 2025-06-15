output "container_id" {
  value = docker_container.busybox_container.id
}

output "image_id" {
  value = docker_image.busybox_image.id
}
