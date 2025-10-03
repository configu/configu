# syntax=docker/dockerfile:1.7-labs

# Usage:
# docker run --rm -w $(pwd) -v $(pwd):$(pwd) configu/cli:latest --help

# Reuse local cache:
# docker run --rm -w $(pwd) -v $(pwd):$(pwd) -v $HOME/.configu/cache:/.configu/cache configu/cli:latest --help

ARG NODE_VERSION="22.20.0"
FROM node:$NODE_VERSION-slim AS base

LABEL author "dev@configu.com"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ARG COREPACK_VERSION="0.34.0"
RUN npm install -g "corepack@${COREPACK_VERSION}" && \
    corepack enable && \
    corepack prepare --activate && \
    pnpm --version && \
    npm cache clean --force

FROM base AS deps

WORKDIR /src

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --parents packages/**/package.json patches ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch --frozen-lockfile

FROM base AS build

WORKDIR /src

COPY --from=deps /pnpm/store /pnpm/store
COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=cache,id=node_modules,target=/src/node_modules \
    pnpm install --frozen-lockfile --prefer-offline

ARG CONFIGU_VERSION="0.0.0"
RUN pnpm --filter=@configu/cli exec \
    npm --no-git-tag-version --allow-same-version version $CONFIGU_VERSION && \
    pnpm --filter=@configu/cli install --ignore-scripts --frozen-lockfile --prefer-offline

RUN pnpm --filter=@configu/cli --if-present run build && \
    pnpm --filter=@configu/cli deploy --prod --ignore-scripts /dist && \
    chmod +x /dist/dist/configu.cjs

FROM node:$NODE_VERSION-alpine AS dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S configu -u 1001 -G nodejs

USER configu

ENV CONFIGU_HOME="/.configu"
ENV CONFIGU_BIN="$CONFIGU_HOME/bin"
ENV PATH="$CONFIGU_BIN:$PATH"
ENV NODE_ENV="production"

RUN mkdir -p $CONFIGU_BIN
COPY --from=build --chown=configu:nodejs /dist/dist/configu.cjs $CONFIGU_BIN/configu

ENTRYPOINT ["configu"]
