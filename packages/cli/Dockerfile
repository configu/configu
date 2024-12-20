# syntax=docker/dockerfile:1.7-labs

ARG NODE_VERSION=22.12.0
FROM node:$NODE_VERSION AS base

LABEL author "dev@configu.com"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /src
COPY --exclude=**/node_modules --exclude=**/*.md --exclude=**/build --exclude=**/dist --exclude=**/tmp . /src
ARG CONFIGU_VERSION="0.0.0"
RUN pnpm --filter=@configu/cli exec npm --no-git-tag-version version $CONFIGU_VERSION
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter=@configu/cli run build
RUN pnpm --filter=@configu/cli deploy --prod --ignore-scripts /dist

FROM node:$NODE_VERSION-alpine AS dist
USER node
WORKDIR /dist
COPY --from=build --chown=node:node /dist/dist /dist
ENV NODE_ENV="production"
ENTRYPOINT [ "node", "configu.cjs" ]
