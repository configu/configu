# syntax=docker/dockerfile:1.7-labs

# Usage:
# docker run --rm -i -w $(pwd) -v $(pwd):$(pwd) configu/cli:latest --help

# Reuse local cache:
# docker run --rm -i -w $(pwd) -v $(pwd):$(pwd) -v $HOME/.configu/cache:/.configu/cache configu/cli:latest --help

ARG NODE_VERSION="22.20.0"
FROM node:$NODE_VERSION-slim AS base

LABEL author "dev@configu.com"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ARG COREPACK_VERSION="0.34.0"
ARG PNPM_VERSION="10.18.0"
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm install -g "corepack@${COREPACK_VERSION}" && \
    corepack enable && \
    corepack prepare "pnpm@${PNPM_VERSION}" --activate && \
    pnpm --version && \
    npm cache clean --force


FROM base AS build

WORKDIR /src

# 1. Copy only manifests for dependency cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --parents packages/**/package.json patches ./

# 2. Pre-fetch dependencies for better cache
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch --frozen-lockfile

# 3. Copy all sources
COPY . .

# 4. Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --ignore-scripts


# 5. Set CLI version and re-install only CLI deps
ARG CONFIGU_VERSION="0.0.0"
RUN pnpm --filter=@configu/cli exec \
    npm --no-git-tag-version --allow-same-version version $CONFIGU_VERSION && \
    pnpm --filter=@configu/cli install --ignore-scripts --frozen-lockfile --prefer-offline


# 6. Build and deploy CLI
RUN pnpm build && \
    pnpm --filter=@configu/cli --if-present run build && \
    pnpm --filter=@configu/cli deploy --prod --ignore-scripts /dist && \
    chmod +x /dist/dist/configu.cjs

FROM node:$NODE_VERSION-alpine AS dist

ENV CONFIGU_HOME="/.configu"
ENV CONFIGU_BIN="$CONFIGU_HOME/bin"
ENV PATH="$CONFIGU_BIN:$PATH"
ENV NODE_ENV="production"

# Ensure bin dir exists
RUN install -d -m 0755 $CONFIGU_BIN

# Copy built CLI binary
COPY --from=build --chown=node:node /dist/dist/configu.cjs $CONFIGU_BIN/configu

USER node

ENTRYPOINT ["node","/.configu/bin/configu"]
