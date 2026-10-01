FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libcurl4 ca-certificates openssh-client && rm -rf /var/lib/apt/lists/*
ARG CODEX_CLI_VERSION=0.159.2
RUN npm install --global @openai/codex@${CODEX_CLI_VERSION} && codex --version
WORKDIR /app
COPY package*.json ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/backend/package.json ./packages/backend/
RUN npm ci --ignore-scripts && npm rebuild bcrypt
COPY . .
CMD ["npm", "run", "start:backend"]
