# syntax=docker/dockerfile:1.7-labs

ARG NODE_VERSION="22.20.0"
FROM node:$NODE_VERSION AS base

LABEL author "dev@configu.com"

# https://pnpm.io/docker#example-2-build-multiple-docker-images-in-a-monorepo
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ARG COREPACK_VERSION="0.32.0"
# https://vercel.com/guides/corepack-errors-github-actions
RUN npm install -g "corepack@${COREPACK_VERSION}"
RUN corepack enable
RUN pnpm --version

FROM base AS build

WORKDIR /src
COPY pnpm-lock.yaml ./
COPY --parents packages/**/package.json patches ./
RUN pnpm fetch

COPY --exclude=**/node_modules --exclude=**/*.md --exclude=**/build --exclude=**/dist --exclude=**/tmp . /src
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

ARG CONFIGU_VERSION="0.0.0"
RUN pnpm --filter=@configu/cli exec \
  npm --no-git-tag-version --allow-same-version version $CONFIGU_VERSION \
  && pnpm install --ignore-scripts

RUN pnpm --filter=@configu/cli --if-present run build && \
    pnpm --filter=@configu/cli deploy --prod --ignore-scripts /dist && \
    chmod +x /dist/dist/configu.cjs

FROM node:$NODE_VERSION-alpine AS dist
USER node

ENV CONFIGU_HOME="$HOME/.configu"
ENV CONFIGU_BIN="$CONFIGU_HOME/bin"
ENV PATH="$CONFIGU_BIN:$PATH"
COPY --from=build --chown=node:node /dist/dist/configu.cjs $CONFIGU_BIN/configu

ENV NODE_ENV="production"
ENTRYPOINT [ "configu" ]

# Usage:
# docker run --rm -w /app -v $(pwd):/app configu/cli:latest --help

# With cached stores:
# docker run --rm -w /app -v /app $(pwd):/app -v $HOME/.configu/cache:/.configu/cache configu/cli:latest --help
