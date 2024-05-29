FROM mcr.microsoft.com/devcontainers/typescript-node

COPY [".nvmrc", "package.json", "pnpm-lock.yaml", "./"]

RUN su node -c "cat .nvmrc"

# Install Node.js version specified in .nvmrc
RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install 20.12.2"

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN su node -c "corepack enable"

RUN su node -c "pnpm fetch"

# Install configu CLI
RUN su node -c "curl https://cli.configu.com/install.sh | sh"
