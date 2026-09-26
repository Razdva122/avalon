FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libcurl4 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/backend/package.json ./packages/backend/
RUN npm ci --ignore-scripts && npm rebuild bcrypt
COPY . .
CMD ["npm", "run", "start:backend"]
