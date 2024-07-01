FROM node:20.12.2-slim as base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /src
WORKDIR /src
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter=@configu/proxy build
RUN pnpm deploy --filter=@configu/proxy --prod /dist

FROM base
COPY --from=build /dist /dist
WORKDIR /dist
RUN ls -la .
EXPOSE 8080
CMD [ "node", "build/index.js" ]
