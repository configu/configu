# syntax=docker/dockerfile:1.7-labs

# todo: replace with multi-stage from cli Dockerfile

ARG NODE_VERSION="22.20.0"
FROM node:$NODE_VERSION AS base

LABEL author "dev@configu.com"

# https://pnpm.io/docker#example-2-build-multiple-docker-images-in-a-monorepo
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# https://vercel.com/guides/corepack-errors-github-actions
RUN npm install -g corepack@latest
RUN corepack enable
RUN pnpm --version

FROM base AS build
COPY --exclude=**/node_modules --exclude=**/*.md --exclude=**/build --exclude=**/dist --exclude=**/tmp . /src
WORKDIR /src

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

ARG CONFIGU_VERSION="0.0.0"
RUN pnpm --filter=@configu/cli exec \
  npm --no-git-tag-version --allow-same-version version $CONFIGU_VERSION \
  && pnpm install --ignore-scripts

RUN pnpm --filter=@configu/proxy --if-present run build
RUN pnpm --filter=@configu/proxy deploy --prod --ignore-scripts /dist

FROM node:$NODE_VERSION-alpine AS dist
RUN npm install -g tsx
USER node

ENV CONFIGU_HOME="$HOME/.configu"
ENV CONFIGU_BIN="$CONFIGU_HOME/bin"
COPY --from=build --chown=node:node /dist $CONFIGU_BIN
WORKDIR $CONFIGU_BIN

ENV NODE_ENV="production"
CMD [ "tsx", "src/index.ts" ]
