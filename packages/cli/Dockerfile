ARG NODE_VERSION
FROM node:$NODE_VERSION-alpine

COPY install.sh /install.sh
RUN apk --no-cache add curl
ARG CONFIGU_VERSION=latest
RUN CONFIGU_VERSION=$CONFIGU_VERSION sh /install.sh
RUN rm -rf /var/cache/apk/* /install.sh

ENTRYPOINT [ "~/.configu/bin/configu" ]
