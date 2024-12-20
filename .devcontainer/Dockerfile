# syntax=docker/dockerfile:1.7-labs

ARG NODE_VERSION="22.12.0"
FROM node:${NODE_VERSION}

ARG NVM_VERSION="0.40.1"

LABEL maintainer="dev@configu.com"

ENV INSTALL_DIR="/usr/local/lib"
ENV DEBIAN_FRONTEND="non-interactive"
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get -y update \
  && apt-get install -y curl \
  && apt-get -y autoclean

COPY [".nvmrc", "package.json", ".npmrc", "pnpm-lock.yaml", "./"]

ENV NVM_DIR="$INSTALL_DIR/.nvm"
RUN mkdir -p $NVM_DIR
RUN curl --silent -o- https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh | bash
RUN source $NVM_DIR/nvm.sh \
  && nvm install \
  && nvm use $(cat .nvmrc) \
  && nvm alias default $(cat .nvmrc) \
  && nvm ls \
  && node -v

ENV PNPM_HOME="$INSTALL_DIR/.pnpm"
RUN mkdir -p $PNPM_HOME
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT="0"
RUN corepack enable \
  && pnpm -v
RUN pnpm fetch

RUN curl https://cli.configu.com/install.sh | sh
RUN configu -v

CMD ["/bin/bash"]
