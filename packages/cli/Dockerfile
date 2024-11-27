ARG NODE_VERSION
FROM node:$NODE_VERSION-alpine

ARG CONFIGU_VERSION=latest

COPY install.cjs /install.cjs
RUN node /install.cjs
RUN rm -f /install.cjs

ENTRYPOINT [ "node", "/root/.configu/bin/configu.js" ]
