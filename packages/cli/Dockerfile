ARG NODE_VERSION
FROM node:$NODE_VERSION-alpine

COPY install.sh /install.sh
RUN apk --no-cache add curl
ARG CONFIGU_VERSION=latest
RUN sh /install.sh
RUN rm -rf /var/cache/apk/* /install.sh

ENTRYPOINT [ "/root/.configu/bin/configu" ]
