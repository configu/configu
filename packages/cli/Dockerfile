FROM node:22.10.0-alpine

COPY install.sh /install.sh
RUN sh /install.sh

ENTRYPOINT [ "~/.configu/bin/configu" ]
