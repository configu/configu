FROM mcr.microsoft.com/devcontainers/typescript-node

LABEL maintainer="dev@configu.com"

COPY [".nvmrc", "package.json", "pnpm-lock.yaml", "./"]

# Install Node.js version specified in .nvmrc
RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install"

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN su node -c "corepack enable"

RUN su node -c "pnpm fetch"

# Install configu CLI
RUN su node -c "curl https://cli.configu.com/install.sh | sh"
