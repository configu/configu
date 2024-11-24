FROM ghcr.io/dockur/windows-arm:4.04

ARG CONFIGU_VERSION=latest
COPY install.ps1 /install.ps1
RUN powershell -ExecutionPolicy Bypass -File "install.ps1"

ENTRYPOINT [ "configu.exe" ]
