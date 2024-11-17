FROM node:22.10.0-alpine

RUN apk --no-cache add curl

ARG CONFIGU_VERSION=latest
COPY install.sh /install.sh
RUN sh /install.sh

ENTRYPOINT [ "~/.configu/bin/configu" ]
