FROM node:22.10.0-bullseye

RUN apt-get update && apt-get install -y curl

ARG CONFIGU_VERSION=latest
COPY install.sh /install.sh
RUN sh /install.sh

ENTRYPOINT [ "/root/.configu/bin/configu" ]
