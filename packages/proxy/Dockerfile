# syntax=docker/dockerfile:1.7-labs

ARG NODE_VERSION
FROM node:$NODE_VERSION-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /src
COPY --exclude=**/node_modules --exclude=*.md --exclude=**/build --exclude=**/dist --exclude=**/tmp . /src
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm clean && pnpm run --filter=@configu/proxy build
RUN pnpm deploy --filter=@configu/proxy --prod /dist --ignore-scripts

FROM node:$NODE_VERSION-alpine AS dist
USER node
WORKDIR /dist
COPY --from=build --chown=node:node /dist /dist
RUN ls -la .
ENV NODE_ENV="production"
CMD [ "node", "build/index.js" ]
