ARG NODE_VERSION="20"
FROM node:${NODE_VERSION}

ARG NVM_VERSION="v0.39.7"

LABEL maintainer="dev@configu.com"

ENV DEBIAN_FRONTEND=non-interactive
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get update \
  && apt-get install -y curl \
  && apt-get -y autoclean

COPY [".nvmrc", "package.json", "pnpm-lock.yaml", "./"]

ENV NVM_DIR /usr/local/nvm
RUN mkdir -p /usr/local/nvm

RUN curl --silent -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash
RUN source $NVM_DIR/nvm.sh \
  && nvm install \
  && nvm alias default current \
  && nvm ls \
  && node -v

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN pnpm -v
RUN pnpm fetch

RUN curl https://cli.configu.com/install.sh | sh
RUN configu -v

CMD ["/bin/bash"]
